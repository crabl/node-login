
$(document).ready(function(){
    var hc = new DancesController();
    
    $('#account-form').ajaxForm({
	beforeSubmit : function(formData, jqForm, options){
	    formData.push({name:'dance_hungariantitle[0]', value:$('#dance1-hungariantitle-tf').val()})
	    return true;
	},
	success	: function(responseText, status, xhr, $form){
	    if (status == 'success') hc.onUpdateSuccess();
	},
	error : function(e){
	    if (e.responseText == 'email-taken'){
		av.showInvalidEmail();
	    }	else if (e.responseText == 'username-taken'){
		av.showInvalidUserName();
	    }
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