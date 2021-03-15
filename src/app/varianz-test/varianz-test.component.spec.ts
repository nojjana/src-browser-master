import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VarianzTestComponent } from './varianz-test.component';

describe('VarianzTestComponent', () => {
  let component: VarianzTestComponent;
  let fixture: ComponentFixture<VarianzTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VarianzTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VarianzTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
