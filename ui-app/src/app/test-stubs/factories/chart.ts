export const createDummyLineChart = function (): unknown {
  const color = '#999';
  const elements = jasmine.createSpy().and.returnValue([
    {
      getAttribute: jasmine.createSpy().and.returnValue({}),
      setAttribute: jasmine.createSpy()
    }
  ]);
  return {
    chartElement: {
      nativeElement: {
        getElementsByClassName: jasmine.createSpy().and.returnValue([{
          getElementsByTagName: elements,
          getAttribute: jasmine.createSpy().and.returnValue(color)
        }]),
        getElementsByTagName: jasmine.createSpy().and.returnValue([
          {
            getElementsByTagName: jasmine.createSpy().and.returnValue([
              {
                append: jasmine.createSpy()
              }
            ])
          }
        ])
      }
    }
  };
};
