package com.qcadoo.mes.assignmentToShift.hooks;

import static com.qcadoo.mes.assignmentToShift.constants.AssignmentToShiftFields.STAFF_ASSIGNMENT_TO_SHIFTS;
import static com.qcadoo.mes.assignmentToShift.constants.AssignmentToShiftFields.STATE;
import static com.qcadoo.mes.assignmentToShift.constants.StaffAssignmentToShiftState.ACCEPTED;
import static com.qcadoo.mes.assignmentToShift.constants.StaffAssignmentToShiftState.CORRECTED;
import static com.qcadoo.mes.assignmentToShift.constants.StaffAssignmentToShiftState.SIMPLE;

import org.springframework.stereotype.Service;

import com.qcadoo.mes.assignmentToShift.states.constants.AssignmentToShiftState;
import com.qcadoo.model.api.search.CustomRestriction;
import com.qcadoo.model.api.search.SearchCriteriaBuilder;
import com.qcadoo.model.api.search.SearchRestrictions;
import com.qcadoo.view.api.ViewDefinitionState;
import com.qcadoo.view.api.components.FieldComponent;
import com.qcadoo.view.api.components.GridComponent;

@Service
public class AssignmentToShiftDetailsHooks {

    private static CustomRestriction customRestrictionAccepted = new CustomRestriction() {

        @Override
        public void addRestriction(final SearchCriteriaBuilder searchBuilder) {
            searchBuilder.add(SearchRestrictions.eq(STATE, ACCEPTED.getStringValue()));
        }

    };

    private static CustomRestriction customRestrictionSimple = new CustomRestriction() {

        @Override
        public void addRestriction(final SearchCriteriaBuilder searchBuilder) {
            searchBuilder.add(SearchRestrictions.eq(STATE, SIMPLE.getStringValue()));
        }
    };

    private static CustomRestriction customRestrictionCorrected = new CustomRestriction() {

        @Override
        public void addRestriction(final SearchCriteriaBuilder searchBuilder) {
            searchBuilder.add(SearchRestrictions.eq(STATE, CORRECTED.getStringValue()));
        }

    };

    public final void addDiscriminatorRestrictionToStaffAssignmentGrid(final ViewDefinitionState view) {
        GridComponent grid = (GridComponent) view.getComponentByReference(STAFF_ASSIGNMENT_TO_SHIFTS);
        grid.setCustomRestriction(customRestrictionSimple);
    }

    public final void addDiscriminatorRestrictionToCorrectedStaffAssignmentGrid(final ViewDefinitionState view) {
        GridComponent grid = (GridComponent) view.getComponentByReference("correctedStaffAssignment");
        grid.setCustomRestriction(customRestrictionCorrected);
    }

    public final void addDiscriminatorRestrictionToAcceptedStaffAssignmentGrid(final ViewDefinitionState view) {
        GridComponent grid = (GridComponent) view.getComponentByReference("plannedStaffAssignment");
        grid.setCustomRestriction(customRestrictionAccepted);
    }

    public void disabledGridWhenStateIsAcceptedOrCorrected(final ViewDefinitionState view) {
        FieldComponent stateField = (FieldComponent) view.getComponentByReference(STATE);
        String state = stateField.getFieldValue().toString();
        GridComponent grid = (GridComponent) view.getComponentByReference(STAFF_ASSIGNMENT_TO_SHIFTS);
        if (AssignmentToShiftState.ACCEPTED.getStringValue().equals(state)
                || AssignmentToShiftState.CORRECTED.getStringValue().equals(state)) {
            grid.setEditable(false);
        } else {
            grid.setEditable(true);
        }
    }

}