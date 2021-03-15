import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabyrinthGameComponent } from './labyrinth-game.component';

describe('LabyrinthGameComponent', () => {
  let component: LabyrinthGameComponent;
  let fixture: ComponentFixture<LabyrinthGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LabyrinthGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabyrinthGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
