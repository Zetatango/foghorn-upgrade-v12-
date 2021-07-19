import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LangSelectorComponent } from './lang-selector.component';

import { SupportedLanguage } from 'app/models/languages';

describe('LangSelectorComponent', () => {
  let component: LangSelectorComponent;
  let fixture: ComponentFixture<LangSelectorComponent>;

  let translateService: TranslateService;

  let tsCurrentLangSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot()
      ],
      declarations: [
        LangSelectorComponent
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LangSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    translateService = TestBed.inject(TranslateService);
    tsCurrentLangSpy = spyOnProperty(translateService, 'currentLang');
    spyOn(translateService, 'use').and.returnValue(of(''));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should set languageFlag when currentLang is not set', () => {
      tsCurrentLangSpy.and.returnValue(undefined);
      component.ngOnInit();

      expect(component.languageFlag).toEqual(SupportedLanguage.fr);
    });

    it('should set languageFlag when currentLang is set', () => {
      tsCurrentLangSpy.and.returnValue(SupportedLanguage.fr);
      component.ngOnInit();

      expect(component.languageFlag).toEqual(SupportedLanguage.en);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from and complete observable', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  describe('toggleLanguage()', () => {
    it('should set languageFlag to fr if currentLang was en', () => {
      tsCurrentLangSpy.and.returnValue(SupportedLanguage.en);
      component.toggleLanguage();

      expect(translateService.use).toHaveBeenCalledOnceWith(SupportedLanguage.fr);
      expect(component.languageFlag).toEqual(SupportedLanguage.fr);
    });

    it('should set languageFlag to en if currentLang was fr', () => {
      tsCurrentLangSpy.and.returnValue(SupportedLanguage.fr);
      component.toggleLanguage();

      expect(translateService.use).toHaveBeenCalledOnceWith(SupportedLanguage.en);
      expect(component.languageFlag).toEqual(SupportedLanguage.en);
    });

    it('should set languageFlag to fr if currentLang is not fr', () => {
      tsCurrentLangSpy.and.returnValue('es');
      component.toggleLanguage();

      expect(translateService.use).toHaveBeenCalledOnceWith(SupportedLanguage.fr);
      expect(component.languageFlag).toEqual(SupportedLanguage.fr);
    });
  });

  describe('updateIntercomLanguage()', () => {
    let intercomSpy: jasmine.Spy;
    beforeEach(() => intercomSpy = (window as any).Intercom = jasmine.createSpy('Intercom')); // eslint-disable-line

    it('should update intercom language with "en"', () => {
      spyOnProperty(translateService, 'onLangChange', 'get').and.returnValue(of({lang: SupportedLanguage.en}));

      component.updateIntercomLanguage();
      expect(intercomSpy).toHaveBeenCalledWith('update', { language_override: SupportedLanguage.en });
    });

    it('should update intercom language with "fr"', () => {
      spyOnProperty(translateService, 'onLangChange', 'get').and.returnValue(of({lang: SupportedLanguage.fr}));

      component.updateIntercomLanguage();
      expect(intercomSpy).toHaveBeenCalledWith('update', { language_override: SupportedLanguage.fr });
    });
  });
});
