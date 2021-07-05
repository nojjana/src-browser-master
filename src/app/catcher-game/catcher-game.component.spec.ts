import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CatcherGameComponent } from './catcher-game.component';

describe('CatcherGameComponent', () => {
  let component: CatcherGameComponent;
  let fixture: ComponentFixture<CatcherGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CatcherGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CatcherGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
