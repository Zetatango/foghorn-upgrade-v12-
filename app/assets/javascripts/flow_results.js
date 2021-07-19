//= require jquery3

$(function() {
  $('.flow_results.show').ready(function() {
    var flow_parameters_encoded = $('#flow-parameters-div').data('flow-parameters');
    var flow_parameters = JSON.parse(atob(flow_parameters_encoded));

    if (window.opener) {
      flow_parameters.type = 'omniauth';
      window.opener.postMessage(flow_parameters);
    }
  });
});
