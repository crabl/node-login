
$(document).ready(function(){
    var hc = new DancesController();
    
    $('#account-form').ajaxForm({
	beforeSubmit : function(formData, jqForm, options){
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

    // customize the account settings form //
    
    $('#account-form h1').text('Account Settings');
    $('#user-tf').attr('disabled', 'disabled');
    $('#account-form-btn1').html('Delete Account');
    $('#account-form-btn1').addClass('btn-danger');
    $('#account-form-btn2').html('Save Changes');

})