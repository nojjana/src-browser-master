import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotInLobbyComponent } from './not-in-lobby.component';

describe('NotInLobbyComponent', () => {
  let component: NotInLobbyComponent;
  let fixture: ComponentFixture<NotInLobbyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotInLobbyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotInLobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
