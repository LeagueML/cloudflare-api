// This exists to polyfill https://github.com/sindresorhus/has-flag
// We don't have a process and there will be no cli arguments.
// We could also use this to set specific cli flags with little hassle.
// (This is only really referenced by fauna->chalk->supports-color)

export default function hasFlag(flag) {
    return false;
}