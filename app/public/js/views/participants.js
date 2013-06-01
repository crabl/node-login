var initDatePicker = function() {
    var eles = $('input[name=dob]:visible');
    for (var i=0; i<eles.length; i++) {
	eles[i].id = "dp"+i.toString();
	$(eles[i]).datepicker({yearRange:"-100:+0", changeMonth:true, changeYear:true});
	$('.ui-datepicker').css("font-size", "85%");
    }
};

$(document).ready(function(){
    var hc = new ParticipantsController();
    
    $('#account-form').ajaxForm({
	beforeSubmit : function(formData, jqForm, options){
	    formData.push({
		name:'arrivalmethod-sf', 
		value: $('#arrivalmethod-sf').val()
	    });
	    formData.push({
                name:'departuremethod-sf',
                value: $('#departuremethod-sf').val()
            });
	    return true;
	},
	success	: function(responseText, status, xhr, $form){
	    if (status == 'success') hc.onUpdateSuccess();
	},
	error : function(e){
	    console.log(e);
	}
    });
    $('#name-tf').focus();

    // initialize the datepicker //
    initDatePicker();

    // customize the account settings form //    
    $('#account-form h1').text('Account Settings');
    $('#user-tf').attr('disabled', 'disabled');
    $('#account-form-btn1').html('Delete Account');
    $('#account-form-btn1').addClass('btn-danger');
    $('#account-form-btn2').html('Save Changes');

});