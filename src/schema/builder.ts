console.log("creating base builder");

import SchemaBuilder from '@pothos/core';
import type { ContextType } from './types';

const builder = new SchemaBuilder<{ Context: ContextType }>({
  });

export default builder;