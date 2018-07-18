declare module 'vue-select';

interface SelectOptionObject {
  label: string;
  value: number | string;
}

type SelectOption = SelectOptionObject | string;
