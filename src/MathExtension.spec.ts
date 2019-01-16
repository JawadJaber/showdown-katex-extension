import showdown from 'showdown';
import { mathExtension } from './MathExtension';

let converter: showdown.Converter;
beforeAll(() => {
  showdown.extension('mathExtension', mathExtension);
  converter = new showdown.Converter({
    extensions: [
      'mathExtension',
    ]
  });
});

describe('MathExtension', () => {
  it('Does not throw errors on valid expressions', () => {
    expect(() => {
      const html = converter.makeHtml('$10$');
    }).not.toThrow();
  })
});