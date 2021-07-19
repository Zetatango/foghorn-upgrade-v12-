import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DashboardTable } from 'app/models/dashboard-table';
import { ConfigurationService } from 'app/services/configuration.service';
import { UtilityService } from 'app/services/utility.service';
import { DashboardTableComponent } from './dashboard-table.component';

describe('DashboardTableComponent', () => {
  let component: DashboardTableComponent;
  let fixture: ComponentFixture<DashboardTableComponent>;

  let configurationService: ConfigurationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardTableComponent],
      imports: [HttpClientTestingModule],
      providers: [
        ConfigurationService,
        UtilityService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardTableComponent);
    component = fixture.componentInstance;
    configurationService = TestBed.inject(ConfigurationService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isActivityActive', () => {
    it('should be true by default', () => {
      expect(component.isActivityActive).toBeTrue();
    });

    it('should be true after switching to activity', () => {
      component.switchToInvoices();
      component.switchToActivity();
      expect(component.isActivityActive).toBeTrue();
    });

    it('should false after switching to invoices', () => {
      component.switchToInvoices();
      expect(component.isActivityActive).toBeFalse();
    });
  });

  describe('isInvoicesActive', () => {
    it('should be false by default', () => {
      expect(component.isInvoicesActive).toBeFalse();
    });

    it('should be false when UI is disabled', () => {
      spyOnProperty(configurationService, 'disableInvoiceUi').and.returnValue(true);
      component.switchToActivity();
      component.switchToInvoices();
      expect(component.isInvoicesActive).toBeFalse();
    });

    it('should be true after switching to invoices and UI is enabled', () => {
      spyOnProperty(configurationService, 'disableInvoiceUi').and.returnValue(false);
      component.switchToActivity();
      component.switchToInvoices();
      expect(component.isInvoicesActive).toBeTrue();
    });

    it('should false after switching to activity', () => {
      component.switchToActivity();
      expect(component.isInvoicesActive).toBeFalse();
    });
  });

  describe('isInvoiceUiDisabled', () => {
    it('should be false when service returns false', () => {
      spyOnProperty(configurationService, 'disableInvoiceUi').and.returnValue(false);
      expect(component.isInvoiceUiDisabled).toBeFalse();
    });

    it('should true when service returns true', () => {
      spyOnProperty(configurationService, 'disableInvoiceUi').and.returnValue(true);
      component.switchToActivity();
      expect(component.isInvoiceUiDisabled).toBeTrue();
    });
  });

  describe('switchToActivity', () => {
    it('should be set active to ACTIVITY', () => {
      component.switchToActivity();
      expect(component.active).toEqual(DashboardTable.ACTIVITY);
    });
  });

  describe('switchToInvoices', () => {
    it('should be set active to INVOICES', () => {
      component.switchToInvoices();
      expect(component.active).toEqual(DashboardTable.INVOICES);
    });
  });

  describe('getClass', () => {
    it('should be set active to active table (ACTIVITY)', () => {
      component.switchToActivity();
      expect(component.getClass(DashboardTable.ACTIVITY)).toEqual('active');
      expect(component.getClass(DashboardTable.INVOICES)).toEqual('');
    });

    it('should be set active to active table (INVOICES)', () => {
      component.switchToInvoices();
      expect(component.getClass(DashboardTable.INVOICES)).toEqual('active');
      expect(component.getClass(DashboardTable.ACTIVITY)).toEqual('');
    });
  });
});
