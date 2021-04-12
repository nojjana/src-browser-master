import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShakerGameComponent } from './shaker-game.component';

describe('ShakerGameComponent', () => {
  let component: ShakerGameComponent;
  let fixture: ComponentFixture<ShakerGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShakerGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShakerGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
