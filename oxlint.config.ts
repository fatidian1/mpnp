import { defineConfig } from 'oxlint';
import universeNode from 'oxlint-config-universe/node';

export default defineConfig({
  extends: [universeNode],
  rules: {
    'max-lines': 'error', // DO NOT REMOVE - it helps keep the project well organized and modularized
  },
});
