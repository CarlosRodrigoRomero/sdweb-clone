import { UtilitiesService } from './utilities.service';

describe('UtilitiesService', () => {
  it('should find duplicates elements in string array, findDuplicates(values: string[]): string[]', () => {
    const mockedData = ['uno', 'hola', 'dos', 'hola', 'hola'];
    const expectedResult = ['hola', 'hola'];
    const result = UtilitiesService.findDuplicates(mockedData);
    expect(result).toEqual(expectedResult);
  });
});
