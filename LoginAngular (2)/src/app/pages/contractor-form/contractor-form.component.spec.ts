import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorFormComponent } from './contractor-form.component';

describe('ContractorFormComponent', () => {
  let component: ContractorFormComponent;
  let fixture: ComponentFixture<ContractorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractorFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContractorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
