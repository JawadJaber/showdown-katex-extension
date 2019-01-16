import { ShowdownExtension } from 'showdown';
import katex from 'katex';

export interface KatexConfig {
  displayMode?: boolean;
  errorColor?: string;
  throwOnError?: boolean;
  delimiters?: Delimiter[];
}

interface Delimiter {
  left: RegExp | string;
  right: RegExp | string;
  displayMode: boolean;
  asciimath?: boolean;
}

const defaultConfig: KatexConfig = {
  throwOnError: true,
  delimiters: [
    // Order is important here
    { left: "$$", right: "$$", displayMode: true },
    { left: "$", right: "$", displayMode: false },
    { left: "\\[", right: "\\]", displayMode: true },
    { left: "\\(", right: "\\)", displayMode: false },
    // TODO: this doesn't work because the && is escaped to &amp;&amp; and so it's not recognized
    // { left: '~', right: '~', displayMode: false, asciimath: true },
    // { left: '&&', right: '&&', display: true, asciimath: true },
  ],
}

const escapeDelimRegExp = (delim: string | RegExp) => {
  if (typeof delim != 'string') {
    return delim.source;
  }

  const regex = /[|\\{}()[\]^$+*?.]/g;

  return delim
    .replace(/\$/g, '\¨D') // As per showdown spec, all $ are replaced with ¨D
    .replace(regex, '\\$&')
}

const isLookbehindSupported = () => {
  let supported = false;

  try {
    supported = !!new RegExp("(?<=)");
    supported = !!new RegExp("(?<!)");
  } catch (e) {}
  
  return supported;
}

export const mathExtension: (() => ShowdownExtension[]) = (config?: KatexConfig) => {
  const mergedConfig = {...defaultConfig, ...config};
  const noPreSlash = isLookbehindSupported() ? new RegExp('(?<!\\\\)').source : '';

  return [
    {
      type: 'lang',
      filter: (text) => {
        const delimiters = mergedConfig.delimiters!;

        delimiters.map(delim => {
          const left = escapeDelimRegExp(delim.left);
          const right = escapeDelimRegExp(delim.right);

          /*
          * First and last capturing group: ((?<!\\)${left}): Match all ${left} that doesn't have \\ before it
          * Second capturing group: match as few characters as possible
          * Flag: Replace as many instances as possible
          */
          const regex = new RegExp(`(${noPreSlash}${left})(.+?)(${noPreSlash}${right})`, 'g');

          text = text.replace(regex, function (match, left, math, right) {
            // Reverse showdown escape of $
            math = math.replace(/¨D/g, '$');

            return katex.renderToString(
              math, 
              { 
                displayMode: delim.displayMode,
                throwOnError: mergedConfig.throwOnError,
              }
            );
          });
        });

        return text;
      }
    },
  ];
}

export default mathExtension;