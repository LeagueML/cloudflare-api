console.log("starting to build schema");

import builder from './builder';

import './types'; // just for safety and cascading type imports...
import './ProfileIcon';
import './Summoner';

builder.queryField("hello", 
    (t) => t.string({
        args: {
            name: t.arg.string(),
        },
        resolve: (parent, { name }) => `hello, ${name || 'World'}`,
    }),
);

builder.queryType({
})

const schema = builder.toSchema({});
console.log("done building schema");
export default schema