import { GetNombreSeguidorPipe } from './get-nombre-seguidor.pipe';

xdescribe('GetNombreSeguidorPipe', () => {
  it('create an instance', () => {
    const pipe = new GetNombreSeguidorPipe();
    expect(pipe).toBeTruthy();
  });
});
