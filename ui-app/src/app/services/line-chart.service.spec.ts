import { CustomLineChartService } from './line-chart.service';
import { createDummyLineChart } from '../test-stubs/factories/chart';

describe('CustomLinerChartService', () => {
  let customLineChartService: CustomLineChartService;
  let chart;
  beforeEach(() => {
    customLineChartService = new CustomLineChartService();
    chart = createDummyLineChart();
  });

  it('should expect', () => {
    expect(customLineChartService).toBeTruthy();
  });

  it('does not create marker when chart is null', function () {
    chart = null;
    spyOn(customLineChartService, 'createMarker');
    customLineChartService.showDots(chart);
    expect(customLineChartService.createMarker).not.toHaveBeenCalled();
  });

  it('does not set marker attributes when chart has no line', function () {
    const emptyChart = {
      chartElement: {
        nativeElement: {
          getElementsByClassName: jasmine.createSpy().and.returnValue([])
        }
      }
    };
    spyOn(customLineChartService, 'createMarker');
    customLineChartService.showDots(emptyChart);
    expect(customLineChartService.createMarker).not.toHaveBeenCalled();
  });

  it('should create markers on the line', () => {
    const color = '#999';
    spyOn(customLineChartService, 'createMarker');
    spyOn(customLineChartService, 'setAttributes');
    customLineChartService.showDots(chart);
    expect(customLineChartService.createMarker).toHaveBeenCalledWith(chart, color, 0);
    expect(customLineChartService.setAttributes).toHaveBeenCalled();
  });


  it('should create markers', () => {
    const color = '#999';
    spyOn(customLineChartService, 'setAttributes');
    customLineChartService.createMarker(chart, color, 0);
    expect(customLineChartService.setAttributes).toHaveBeenCalled();
  });


  it('should add attributes of an elements', function () {
    const attributes = {height: '10px'};
    const dummyElement = document.createElement('div');
    customLineChartService.setAttributes(dummyElement, attributes);
    expect(dummyElement.getAttribute('height')).toBe('10px');
  });

})
;
