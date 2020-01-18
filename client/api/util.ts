export class Util {
  static partition<T>(array: T[], filter: (item: T) => boolean) {
    return array.reduce(
      ([pass, fail], elem) => {
        return filter(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
      },
      [[], []] as T[][],
    );
  }
}
