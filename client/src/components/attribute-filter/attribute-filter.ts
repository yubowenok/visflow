import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import VueSelect from '@/components/vue-select/vue-select';
import _ from 'lodash';

import template from './attribute-filter.html';
import { SubsetPackage } from '@/data/package';
import ConstantsList from '@/components/constants-list/constants-list';
import { injectNodeTemplate } from '@/components/node';
import { SubsetInputPort, SubsetOutputPort, ConstantsInputPort } from '@/components/port';
import { SubsetNode } from '@/components/subset-node';
import ColumnSelect from '@/components/column-select/column-select';
import { ValueType } from '@/data/parser';
import { valueDisplay } from '@/common/util';

enum FilterType {
  PATTERN = 'pattern',
  RANGE = 'range',
  SAMPLING = 'sampling',
}

enum PatternMatchMode {
  FULL_STRING = 'full-string',
  SUBSTRING = 'substring',
  REGEX = 'regex',
}

enum SamplingCriterion {
  MINIMUM = 'minimum',
  MAXIMUM = 'maximum',
  RANDOM = 'random',
}

enum SamplingAmountType {
  COUNT = 'count',
  PERCENTAGE = 'percentage',
}

interface PatternParams {
  patterns: string[];
  mode: PatternMatchMode;
  isCaseSensitive: boolean;
}

interface RangeParams {
  min: number | string | null;
  max: number | string | null;
}

interface SamplingParams {
  groupByColumn: number | null;
  criterion: SamplingCriterion;
  amountType: SamplingAmountType;
  amount: number;
  // Sampling based on distinct values. Values are first uniqued before percentage or count is taken.
  isOnDistinctValues: boolean;
}

interface AttributeFilterSave {
  column: number | null;
  filterType: FilterType;
  patternParams: PatternParams;
  rangeParams: RangeParams;
  samplingParams: SamplingParams;
}

const DEFAULT_PATTERN_PARAMS: PatternParams = {
  patterns: [],
  mode: PatternMatchMode.SUBSTRING,
  isCaseSensitive: false,
};

const DEFAULT_RANGE_PARAMS: RangeParams = {
  min: null,
  max: null,
};

const DEFAULT_SAMPLING_PARAMS: SamplingParams = {
  groupByColumn: null,
  criterion: SamplingCriterion.RANDOM,
  amountType: SamplingAmountType.PERCENTAGE,
  amount: 5,
  isOnDistinctValues: false,
};


@Component({
  template: injectNodeTemplate(template),
  components: {
    ColumnSelect,
    VueSelect,
    ConstantsList,
  },
})
export default class AttributeFilter extends SubsetNode {
  protected NODE_TYPE = 'attribute-filter';
  protected DEFAULT_WIDTH = 120;
  protected RESIZABLE = true;

  private column: number | null = null;
  private filterType: FilterType = FilterType.PATTERN;

  private patternParams = _.clone(DEFAULT_PATTERN_PARAMS);
  private rangeParams = _.clone(DEFAULT_RANGE_PARAMS);
  private samplingParams = _.clone(DEFAULT_SAMPLING_PARAMS);

  get columnName(): string {
    return this.dataset && this.column !== null ? this.getDataset().getColumnName(this.column) : '';
  }

  get columnType(): ValueType {
    return this.dataset && this.column !== null ? this.getDataset().getColumnType(this.column) : ValueType.EMPTY;
  }

  get getPatternFilterDisplayText(): string {
    let conjunction = 'is';
    if (this.patternParams.mode === PatternMatchMode.SUBSTRING) {
      conjunction = 'contains';
    } else if (this.patternParams.mode === PatternMatchMode.REGEX) {
      conjunction = 'matches';
    }
    const patternStr = this.patternParams.patterns.length ?
      this.patternParams.patterns.join(', ') : '(no pattern specified)';
    return ` ${conjunction} ${patternStr}`;
  }

  get getRangeFilterDisplayText(): string {
    const min = this.rangeParams.min;
    const max = this.rangeParams.max;
    let rangeText = '';
    if (min !== null && max !== null) {
      rangeText = ` in [${valueDisplay(min, this.columnType)}, ${valueDisplay(max, this.columnType)}]`;
    } else if (min === null && max !== null) {
      rangeText = ' ≤ ' + valueDisplay(max, this.columnType);
    } else if (min !== null && max === null) {
      rangeText = ' ≥ ' + valueDisplay(min, this.columnType);
    } else {
      rangeText = '(no range specified)';
    }
    return rangeText;
  }

  get getSamplingFilterDisplayText(): string {
    return `${this.samplingParams.amount}${this.samplingParams.amountType === SamplingAmountType.PERCENTAGE ? '%' : ''}
      ${this.samplingParams.criterion} `;
  }

  get filterTypeOptions(): SelectOption[] {
    return [
      { label: 'Pattern', value: FilterType.PATTERN },
      { label: 'Range', value: FilterType.RANGE },
      { label: 'Sampling', value: FilterType.SAMPLING },
    ];
  }

  get patternMatchModeOptions(): SelectOption[] {
    return [
      { label: 'Substring', value: PatternMatchMode.SUBSTRING },
      { label: 'Full String', value: PatternMatchMode.FULL_STRING },
      { label: 'Regular Expression', value: PatternMatchMode.REGEX },
    ];
  }

  get samplingAmountTypeOptions(): SelectOption[] {
    return [
      { label: 'Percentage', value: SamplingAmountType.PERCENTAGE },
      { label: 'Count', value: SamplingAmountType.COUNT },
    ];
  }

  get samplingCriterionOptions(): SelectOption[] {
    return [
      { label: 'Maximum', value: SamplingCriterion.MAXIMUM },
      { label: 'Minimum', value: SamplingCriterion.MINIMUM },
      { label: 'Random', value: SamplingCriterion.RANDOM },
    ];
  }

  protected onDatasetChange() {
    // Reset filtering column to avoid unexpected filtering.
    this.column = null;
  }

  protected created() {
    this.serializationChain.push((): AttributeFilterSave => ({
      column: this.column,
      filterType: this.filterType,
      patternParams: this.patternParams,
      rangeParams: this.rangeParams,
      samplingParams: this.samplingParams,
    }));
  }

  protected createPorts() {
    this.inputPorts = [
      new SubsetInputPort({
        data: {
          id: 'in',
          node: this,
        },
        store: this.$store,
      }),
      new ConstantsInputPort({
        data: {
          id: 'constants',
          node: this,
        },
        store: this.$store,
      }),
    ];
    this.outputPorts = [
      new SubsetOutputPort({
        data: {
          id: 'out',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    this.filter();
  }

  protected filter() {
    if (this.column === null) {
      this.coverText = 'No column';
      this.forwardSubset(this.inputPortMap.in, this.outputPortMap.out);
      return;
    }
    this.coverText = '';
    let pkg: SubsetPackage;
    if (this.filterType === FilterType.PATTERN) {
      pkg = this.filterByPattern();
    } else if (this.filterType === FilterType.RANGE) {
      pkg = this.filterByRange();
    } else { // FilterType.SAMPLING
      pkg = this.filterBySampling();
    }
    this.outputPortMap.out.updatePackage(pkg);
  }

  private filterByPattern() {
    const pkg = this.inputPortMap.in.getSubsetPackage().clone();
    const dataset = this.getDataset();
    const mode = this.patternParams.mode;

    let patterns = this.patternParams.patterns;
    if (this.patternParams.isCaseSensitive && mode !== PatternMatchMode.REGEX) {
      patterns = patterns.map(pattern => pattern.toLowerCase());
    }
    pkg.filterItems(item => {
      let value = dataset.getCell(item, this.column as number).toString();
      if (this.patternParams.isCaseSensitive && mode !== PatternMatchMode.REGEX) {
        value = value.toLowerCase();
      }
      if (mode === PatternMatchMode.FULL_STRING) {
        if (patterns.indexOf(value) !== -1) {
          return true;
        }
      } else if (mode === PatternMatchMode.SUBSTRING) {
        for (const pattern of patterns) {
          if (value.indexOf(pattern) !== -1) {
            return true;
          }
        }
      } else { // PatternMatchMode.REGEX
        for (const pattern of patterns) {
          const regex = new RegExp(pattern);
          if (value.match(regex) !== null) {
            return true;
          }
        }
      }
      return false;
    });
    return pkg;
  }

  private filterByRange() {
    const pkg = this.inputPortMap.in.getSubsetPackage().clone();
    const dataset = this.getDataset();
    pkg.filterItems(item => {
      const value = dataset.getCell(item, this.column as number);
      const min = this.rangeParams.min;
      const max = this.rangeParams.max;
      if (min !== null && !(min <= value)) {
        return false;
      }
      if (max !== null && !(value <= max)) {
        return false;
      }
      return true;
    });
    return pkg;
  }

  private filterBySampling() {
    const pkg = this.inputPortMap.in.getSubsetPackage().clone();
    const dataset = this.getDataset();

    // TODO: add sampler code here
    return pkg;
  }

  private filterAndPropagate() {
    this.filter();
    this.propagate();
  }

  /**
   * Notifies dataflow of filter changes.
   */
  private propagate() {
    this.portUpdated(this.outputPortMap.out);
  }
}
