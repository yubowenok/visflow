declare module 'vue-select';

interface SelectOptionObject {
  label: string;
  value: number | string;
  disabled?: boolean;
}

type SelectOption = SelectOptionObject | string;
