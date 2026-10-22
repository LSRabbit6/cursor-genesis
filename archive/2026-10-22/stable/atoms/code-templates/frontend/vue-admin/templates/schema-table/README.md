# Schema-Driven Table Template (Vue 3 + PlusPro)

**Use Case**: Standard CRUD List pages.

## Structure

*   `schema.ts`: Defines table columns, search fields, and form rules.
*   `api.js`: Standard Axios wrappers.
*   `index.vue`: Logic-less UI container using `PlusTable`.

## Example: index.vue

```vue
<script setup>
import { useTable } from '@/hooks/useTable'; // Standard hook
import { getList } from './api';
import { tableColumns, searchColumns } from './schema';

const { tableData, total, loading, handleSearch } = useTable(getList);
</script>

<template>
  <PlusTable
    :columns="tableColumns"
    :search="searchColumns"
    :data="tableData"
    :total="total"
    :loading="loading"
    @search="handleSearch"
  />
</template>
```
