import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import VueSelect from '@/components/vue-select/vue-select';
import _ from 'lodash';

import template from './attribute-filter.html';
import { SubsetPackage } from '@/data/package';
import { injectNodeTemplate } from '@/components/node';
import { SubsetInputPort, SubsetOutputPort, ConstantsInputPort } from '@/components/port';
import { SubsetNode } from '@/components/subset-node';
import ColumnSelect from '@/components/column-select/column-select';

enum FilterType {
  PATTERN = 'pattern',
  RANGE = 'range',
  SAMPLING = 'sampling',
}

enum PatternMatchMode {
  FULL_STRING = 'full-string',
  SUBSTRING = 'substring',
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

interface AttributeFilterSave {
  column: number | null;
  filterType: FilterType;
  patternParams: {
    patterns: string[];
    mode: PatternMatchMode;
    isRegex: boolean;
    isCaseSensitive: boolean;
  };
  rangeParams: {
    min: number | string | null;
    max: number | string | null;
  };
  samplingParams: {
    groupByColumn: number | null;
    amountType: SamplingAmountType;
    amount: number;
    // Sampling based on distinct values. Values are first uniqued before percentage or count is taken.
    isOnDistinctValues: boolean;
  };
}

const DEFAULT_PATTERN_PARAMS = {
  patterns: [],
  mode: PatternMatchMode.SUBSTRING,
  isRegex: false,
  isCaseSensitive: false,
};

const PATTERN_MATCH_MODE_LABEL = {
  'full-string': 'Full String',
  'substring': 'Substring',
};

const DEFAULT_RANGE_PARAMS = {
  min: null,
  max: null,
};

const DEFAULT_SAMPLING_PARAMS = {
  groupByColumn: null,
  amountType: SamplingAmountType.PERCENTAGE,
  amount: 5,
  isOnDistinctValues: false,
};

@Component({
  template: injectNodeTemplate(template),
  components: {
    ColumnSelect,
    VueSelect,
  },
})
export default class AttributeFilter extends SubsetNode {
  protected NODE_TYPE = 'attribute-filter';
  protected DEFAULT_WIDTH = 120;

  private column: number | null = null;
  private filterType: FilterType = FilterType.PATTERN;

  private patternParams = _.clone(DEFAULT_PATTERN_PARAMS);
  private rangeParams = _.clone(DEFAULT_RANGE_PARAMS);
  private samplingParams = _.clone(DEFAULT_SAMPLING_PARAMS);

  protected onDatasetChange() {
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
      return;
    }
    this.coverText = '';

    const pkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = this.getDataset();

    switch (this.filterType) {
      case FilterType.PATTERN:
        this.filterByPattern();
        break;
      case FilterType.RANGE:
        this.filterByRange();
        break;
      case FilterType.SAMPLING:
        this.filterBySampling();
        break;
    }
  }

  private filterByPattern() {

  }

  private filterByRange() {

  }

  private filterBySampling() {

  }

  private onSelectColumn(columnIndex: number) {
    this.column = columnIndex;
    this.filter();
    this.propagate();
  }

  private get filterTypeOptions(): SelectOption[] {
    return [
      { label: 'Pattern', value: FilterType.PATTERN },
      { label: 'Range', value: FilterType.RANGE },
      { label: 'Sampling', value: FilterType.SAMPLING },
    ];
  }

  private get patternMatchModeOptions(): SelectOption[] {
    return [
      { label: 'Substring', value: PatternMatchMode.SUBSTRING },
      { label: 'Full String', value: PatternMatchMode.FULL_STRING },
    ];
  }

  private onSelectPatternMatchMode(mode: PatternMatchMode) {
    console.log(mode, this.patternParams.mode);
    this.patternParams.mode = mode;
  }

  private onSelectFilterType() {
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
