import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WhackAMoleGameComponent } from './whack-a-mole-game.component';

describe('WhackAMoleGameComponent', () => {
  let component: WhackAMoleGameComponent;
  let fixture: ComponentFixture<WhackAMoleGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WhackAMoleGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WhackAMoleGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
