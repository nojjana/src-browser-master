import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SeesawGameComponent } from './seesaw-game.component';

describe('SeesawGameComponent', () => {
  let component: SeesawGameComponent;
  let fixture: ComponentFixture<SeesawGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SeesawGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SeesawGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
