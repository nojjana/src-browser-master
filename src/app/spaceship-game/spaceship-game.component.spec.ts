import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceshipGameComponent } from './spaceship-game.component';

describe('SpaceshipGameComponent', () => {
  let component: SpaceshipGameComponent;
  let fixture: ComponentFixture<SpaceshipGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpaceshipGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceshipGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
