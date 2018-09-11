import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import * as history from './history';
import ColumnSelect from '@/components/column-select/column-select';
import ConstantsList from '@/components/constants-list/constants-list';
import FormInput from '@/components/form-input/form-input';
import FormSelect from '@/components/form-select/form-select';
import template from './attribute-filter.html';
import { INDEX_COLUMN } from '@/common/constants';
import { SubsetInputPort, SubsetOutputPort, ConstantsInputPort } from '@/components/port';
import { SubsetNodeBase } from '@/components/subset-node';
import { SubsetPackage } from '@/data/package';
import { ValueType } from '@/data/parser';
import { getColumnSelectOptions } from '@/data/util';
import { injectNodeTemplate } from '@/components/node';
import { valueDisplay } from '@/common/util';

export enum FilterType {
  PATTERN = 'pattern',
  RANGE = 'range',
  EXTREMUM = 'extremum',
  SAMPLING = 'sampling',
}

export enum PatternMatchMode {
  FULL_STRING = 'full-string',
  SUBSTRING = 'substring',
  REGEX = 'regex',
}

enum ConstantsMode {
  INPUT = 'input',
  RECEIVED = 'received',
}

export enum ExtremumCriterion {
  MINIMUM = 'minimum',
  MAXIMUM = 'maximum',
}

/**
 * Currently samplingCriterion can only be set to RANDOM.
 * This is to avoid confusing the user with too complicated combined options.
 */
export enum SamplingCriterion {
  MINIMUM = 'minimum',
  MAXIMUM = 'maximum',
  RANDOM = 'random',
}

export enum AmountType {
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

interface AttributeFilterSave {
  column: number | null;
  filterType: FilterType;
  patternParams: PatternParams;
  rangeParams: RangeParams;
  samplingCriterion: SamplingCriterion;
  extremumCriterion: ExtremumCriterion;
  amount: number | null;
  amountType: AmountType;
  isOnDistinctValues: boolean;
  groupByColumn: number | null;
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

@Component({
  template: injectNodeTemplate(template),
  components: {
    ColumnSelect,
    FormSelect,
    ConstantsList,
    FormInput,
  },
})
export default class AttributeFilter extends SubsetNodeBase {
  protected NODE_TYPE = 'attribute-filter';
  protected DEFAULT_WIDTH = 120;
  protected RESIZABLE = true;

  // Typing
  protected inputPortMap: { [id: string]: SubsetInputPort | ConstantsInputPort } = {};
  protected outputPortMap: { [id: string]: SubsetOutputPort } = {};

  private column: number | null = null;
  private filterType: FilterType = FilterType.PATTERN;

  private patternParams = _.clone(DEFAULT_PATTERN_PARAMS);
  private rangeParams = _.clone(DEFAULT_RANGE_PARAMS);

  private extremumCriterion = ExtremumCriterion.MAXIMUM;
  private samplingCriterion = SamplingCriterion.RANDOM;
  private amount: number | null = null;
  private amountType: AmountType = AmountType.PERCENTAGE;
  // Sampling/extremum based on distinct values. Values are first uniqued before percentage or count is taken.
  private isOnDistinctValues = false;
  private groupByColumn: number | null = null;

  get constantsMode(): ConstantsMode {
    return this.inputPortMap.constants.isConnected() ? ConstantsMode.RECEIVED : ConstantsMode.INPUT;
  }

  get inputDisabled(): boolean {
    return this.constantsMode === ConstantsMode.RECEIVED;
  }

  get constants(): Array<string | number> {
    return (this.inputPortMap.constants as ConstantsInputPort).getConstantsPackage().getConstants();
  }

  get columnName(): string {
    return this.dataset && this.column !== null ? this.getDataset().getColumnName(this.column) : '';
  }

  get groupByColumnName(): string {
    return this.dataset && this.groupByColumn !== null ?
      this.getDataset().getColumnName(this.groupByColumn) : '';
  }

  get columnType(): ValueType {
    return this.dataset && this.column !== null ? this.getDataset().getColumnType(this.column) : ValueType.EMPTY;
  }

  get firstConstant(): string | number {
    return this.constants.length ? this.constants[0] : '';
  }

  get secondConstant(): string | number {
    return this.constants.length >= 2 ? this.constants[1] : (this.constants.length ? this.constants[1] : '');
  }

  get patternFilterDisplayText(): string {
    let conjunction = 'is';
    if (this.patternParams.mode === PatternMatchMode.SUBSTRING) {
      conjunction = 'contains';
    } else if (this.patternParams.mode === PatternMatchMode.REGEX) {
      conjunction = 'matches';
    }
    const patterns: string[] = this.inputDisabled ?
      this.constants.map(value => value.toString()) : this.patternParams.patterns;
    const patternStr = patterns.length ? patterns.join(', ') : '(no pattern)';
    return ` ${conjunction} ${patternStr}`;
  }

  get rangeFilterDisplayText(): string {
    const min = this.inputDisabled ? this.firstConstant : this.rangeParams.min;
    const max = this.inputDisabled ? this.secondConstant : this.rangeParams.max;
    let rangeText = '';
    if (min !== null && max !== null) {
      rangeText = ` in [${valueDisplay(min, this.columnType)}, ${valueDisplay(max, this.columnType)}]`;
    } else if (min === null && max !== null) {
      rangeText = ' ≤ ' + valueDisplay(max, this.columnType);
    } else if (min !== null && max === null) {
      rangeText = ' ≥ ' + valueDisplay(min, this.columnType);
    } else {
      rangeText = '(no range)';
    }
    return rangeText;
  }

  get amountDisplayText(): string {
    const amount = (this.inputDisabled ? this.firstConstant : this.amount) || '(no amount)';
    return `${amount}${this.amountType === AmountType.PERCENTAGE ? '%' : ''}`;
  }

  get filterTypeOptions(): SelectOption[] {
    return [
      { label: 'Pattern', value: FilterType.PATTERN },
      { label: 'Range', value: FilterType.RANGE },
      { label: 'Extremum', value: FilterType.EXTREMUM },
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

  get amountTypeOptions(): SelectOption[] {
    return [
      { label: 'Percentage', value: AmountType.PERCENTAGE },
      { label: 'Count', value: AmountType.COUNT },
    ];
  }

  get extremumCriterionOptions(): SelectOption[] {
    return [
      { label: 'Maximum', value: ExtremumCriterion.MAXIMUM },
      { label: 'Minimum', value: ExtremumCriterion.MINIMUM },
    ];
  }

  public setFilterType(type: FilterType) {
    this.filterType = type;
    this.updateAndPropagate();
  }

  public setColumn(column: number | null) {
    this.column = column;
    this.updateAndPropagate();
  }

  public setPatterns(patterns: string[]) {
    this.patternParams.patterns = patterns;
    this.updateAndPropagate();
  }

  public setPatternMatchMode(mode: PatternMatchMode) {
    this.patternParams.mode = mode;
    this.updateAndPropagate();
  }

  public setPatternCaseSensitive(value: boolean) {
    this.patternParams.isCaseSensitive = value;
    this.updateAndPropagate();
  }

  public setRangeMin(value: number | null) {
    this.rangeParams.min = value;
    this.updateAndPropagate();
  }

  public setRangeMax(value: number | null) {
    this.rangeParams.max = value;
    this.updateAndPropagate();
  }

  public setExtremumCriterion(criterion: ExtremumCriterion) {
    this.extremumCriterion = criterion;
    this.updateAndPropagate();
  }

  public setAmountType(type: AmountType) {
    this.amountType = type;
    this.updateAndPropagate();
  }

  public setAmount(amount: number | null) {
    this.amount = amount;
    this.updateAndPropagate();
  }

  public setGroupByColumn(column: number | null) {
    this.groupByColumn = column;
    this.updateAndPropagate();
  }

  public setOnDistinctValues(value: boolean) {
    this.isOnDistinctValues = value;
    this.updateAndPropagate();
  }

  protected get columnSelectOptionsWithIndex() {
    const options = getColumnSelectOptions(this.dataset);
    return this.filterType === FilterType.SAMPLING ?
      options.concat({ value: INDEX_COLUMN, label: '[index]' }) : options;
  }

  protected onDatasetChange() {
    if (this.column === null) {
      return;
    }
    if (this.dataset === null || this.column >= this.dataset.numColumns()) {
      this.column = null;
    }
  }

  protected created() {
    this.serializationChain.push((): AttributeFilterSave => ({
      column: this.column,
      filterType: this.filterType,
      patternParams: this.patternParams,
      rangeParams: this.rangeParams,
      samplingCriterion: this.samplingCriterion,
      extremumCriterion: this.extremumCriterion,
      amount: this.amount,
      amountType: this.amountType,
      isOnDistinctValues: this.isOnDistinctValues,
      groupByColumn: this.groupByColumn,
    }));
  }

  protected createInputPorts() {
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
      this.forwardSubset(this.inputPortMap.in as SubsetInputPort, this.outputPortMap.out);
      return;
    }
    this.coverText = '';
    let pkg: SubsetPackage;
    if (this.filterType === FilterType.PATTERN) {
      pkg = this.filterByPattern();
    } else if (this.filterType === FilterType.RANGE) {
      pkg = this.filterByRange();
    } else if (this.filterType === FilterType.EXTREMUM) {
      pkg = this.filterByExtremum();
    } else { // FilterType.SAMPLING
      pkg = this.filterBySampling();
    }
    this.outputPortMap.out.updatePackage(pkg);
  }

  private filterByPattern(): SubsetPackage {
    const pkg = (this.inputPortMap.in as SubsetInputPort).getSubsetPackage().clone();
    const dataset = this.getDataset();
    const mode = this.patternParams.mode;

    let patterns = this.inputDisabled ? this.constants.map(value => value.toString()) : this.patternParams.patterns;
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

  private filterByRange(): SubsetPackage {
    const pkg = (this.inputPortMap.in as SubsetInputPort).getSubsetPackage().clone();
    const dataset = this.getDataset();
    const min = this.inputDisabled ? (this.firstConstant || null) : this.rangeParams.min;
    const max = this.inputDisabled ? (this.secondConstant || null) : this.rangeParams.max;
    pkg.filterItems(item => {
      const value = dataset.getCell(item, this.column as number);
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

  private filterByExtremum(): SubsetPackage {
    if (this.isOnDistinctValues) {
      return this.extremumOnDistinctValues();
    } else {
      return this.extremumOnDataItems();
    }
  }

  private extremumOnDataItems(): SubsetPackage {
    const pkg = (this.inputPortMap.in as SubsetInputPort).getSubsetPackage().clone();
    const dataset = this.getDataset();
    const itemGroups = pkg.groupItems(this.groupByColumn);
    pkg.clearItems();
    const amount = +((this.inputDisabled ? this.firstConstant : this.amount) || 0);

    for (const group of itemGroups) {
      const groupWithValues = group.map(itemIndex => ({
        index: itemIndex,
        value: dataset.getCell(itemIndex, this.column as number),
      }));
      const sortedItems = _.sortBy(groupWithValues, 'value').map(pair => pair.index);
      let count = this.amountType === AmountType.COUNT ?
        amount : Math.ceil(amount / 100 * sortedItems.length);
      if (count > sortedItems.length) {
        count = sortedItems.length;
      }
      if (this.extremumCriterion === ExtremumCriterion.MAXIMUM) {
        sortedItems.reverse();
      }
      const acceptedItems = sortedItems.slice(0, count);
      pkg.addItemIndices(acceptedItems);
    }
    return pkg;
  }

  private extremumOnDistinctValues(): SubsetPackage {
    const pkg = (this.inputPortMap.in as SubsetInputPort).getSubsetPackage().clone();
    const dataset = this.getDataset();
    const itemGroups = pkg.groupItems(this.groupByColumn);
    pkg.clearItems();
    const amount = +((this.inputDisabled ? this.firstConstant : this.amount) || 0);

    for (const group of itemGroups) {
      const columnValues: Array<number | string | null> = dataset.getDomainValues(this.column as number, group, true);
      let count = this.amountType === AmountType.COUNT ?
        amount : Math.ceil(amount / 100 * columnValues.length);
      if (count > columnValues.length) {
        count = columnValues.length;
      }
      if (this.extremumCriterion === ExtremumCriterion.MAXIMUM) {
        columnValues.reverse();
      }
      const acceptedValues: Array<number | string | null> = columnValues.slice(0, count);
      const acceptedValueSet = new Set(acceptedValues);
      for (const itemIndex of group) {
        const value = dataset.getCell(itemIndex, this.column as number);
        if (acceptedValueSet.has(value)) {
          pkg.addItemIndex(itemIndex);
        }
      }
    }
    return pkg;
  }

  private filterBySampling(): SubsetPackage {
    if (this.isOnDistinctValues) {
      return this.sampleOnDistinctValues();
    } else {
      return this.sampleOnDataItems();
    }
  }

  private sampleOnDataItems(): SubsetPackage {
    const pkg = (this.inputPortMap.in as SubsetInputPort).getSubsetPackage().clone();
    const dataset = this.getDataset();
    const itemGroups = pkg.groupItems(this.groupByColumn);
    pkg.clearItems();
    const amount = +((this.inputDisabled ? this.firstConstant : this.amount) || 0);
    for (const group of itemGroups) {
      const groupWithValues = group.map(itemIndex => ({
        index: itemIndex,
        value: dataset.getCell(itemIndex, this.column as number),
      }));
      const sortedItems = _.sortBy(groupWithValues, 'value').map(pair => pair.index);
      let count = this.amountType === AmountType.COUNT ?
        amount : Math.ceil(amount / 100 * sortedItems.length);
      if (count > sortedItems.length) {
        count = sortedItems.length;
      }
      let acceptedItems: number[] = [];
      switch (this.samplingCriterion) {
        case SamplingCriterion.MAXIMUM:
        case SamplingCriterion.MINIMUM:
          if (this.samplingCriterion === SamplingCriterion.MAXIMUM) {
            sortedItems.reverse();
          }
          acceptedItems = sortedItems.slice(0, count);
          break;
        case SamplingCriterion.RANDOM:
          acceptedItems = _.shuffle(sortedItems).slice(0, count);
          break;
      }
      pkg.addItemIndices(acceptedItems);
    }
    return pkg;
  }

  private sampleOnDistinctValues(): SubsetPackage {
    const pkg = (this.inputPortMap.in as SubsetInputPort).getSubsetPackage().clone();
    const dataset = this.getDataset();
    const itemGroups = pkg.groupItems(this.groupByColumn);
    pkg.clearItems();
    const amount = +((this.inputDisabled ? this.firstConstant : this.amount) || 0);
    for (const group of itemGroups) {
      const columnValues: Array<number | string | null> = dataset.getDomainValues(this.column as number, group, true);
      let count = this.amountType === AmountType.COUNT ?
        amount : Math.ceil(amount / 100 * columnValues.length);
      if (count > columnValues.length) {
        count = columnValues.length;
      }
      let acceptedValues: Array<number | string | null> = [];
      switch (this.samplingCriterion) {
        case SamplingCriterion.MAXIMUM:
        case SamplingCriterion.MINIMUM:
          if (this.samplingCriterion === SamplingCriterion.MAXIMUM) {
            columnValues.reverse();
          }
          acceptedValues = columnValues.slice(0, count);
          break;
        case SamplingCriterion.RANDOM:
          acceptedValues = _.shuffle(columnValues).slice(0, count);
          break;
      }
      const acceptedValueSet = new Set(acceptedValues);
      for (const itemIndex of group) {
        const value = dataset.getCell(itemIndex, this.column as number);
        if (acceptedValueSet.has(value)) {
          pkg.addItemIndex(itemIndex);
        }
      }
    }
    return pkg;
  }

  private onSelectFilterType(type: FilterType, prevType: FilterType) {
    this.commitHistory(history.selectFilterTypeEvent(this, type, prevType));
    this.setFilterType(type);
  }

  private onSelectColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectColumnEvent(this, column, prevColumn));
    this.setColumn(column);
  }

  private onInputPatterns(patterns: string[], prevPatterns: string[]) {
    this.commitHistory(history.inputPatternsEvent(this, patterns, prevPatterns));
    this.setPatterns(patterns);
  }

  private onSelectPatternMatchMode(mode: PatternMatchMode, prevMode: PatternMatchMode) {
    this.commitHistory(history.selectPatternMatchModeEvent(this, mode, prevMode));
    this.setPatternMatchMode(mode);
  }

  private onTogglePatternCaseSensitive(value: boolean) {
    this.commitHistory(history.togglePatternCaseSensitiveEvent(this, value));
    this.setPatternCaseSensitive(value);
  }

  private onInputRangeMin(value: number | null, prevValue: number | null) {
    console.log(value, prevValue);
    this.commitHistory(history.inputRangeMin(this, value, prevValue));
    this.setRangeMin(value);
  }

  private onInputRangeMax(value: number | null, prevValue: number | null) {
    this.commitHistory(history.inputRangeMax(this, value, prevValue));
    this.setRangeMax(value);
  }

  private onSelectExtremumCriterion(criterion: ExtremumCriterion, prevCriterion: ExtremumCriterion) {
    this.commitHistory(history.selectExtremumCriterion(this, criterion, prevCriterion));
    this.setExtremumCriterion(criterion);
  }

  private onSelectAmountType(type: AmountType, prevType: AmountType) {
    this.commitHistory(history.selectAmountType(this, type, prevType));
    this.setAmountType(type);
  }

  private onInputAmount(amount: number | null, prevAmount: number | null) {
    this.commitHistory(history.inputAmount(this, amount, prevAmount));
    this.setAmount(amount);
  }

  private onSelectGroupByColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectGroupByColumn(this, column, prevColumn));
    this.setGroupByColumn(column);
  }

  private onToggleOnDistinctValues(value: boolean) {
    this.commitHistory(history.toggleOnDistinctValues(this, value));
    this.setOnDistinctValues(value);
  }
}
