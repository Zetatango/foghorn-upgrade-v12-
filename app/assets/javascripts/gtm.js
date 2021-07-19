const gtmElementData = $("#gtm_container_id").data();
if (gtmElementData && gtmElementData.gtmContainerId) {
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer', gtmElementData.gtmContainerId);
}

$(() => {
  $(".merchants.new").ready(gtmInit);

  function gtmInit() {
    const dataLayer = window.dataLayer;
    if (dataLayer) {
      pushCurrentPage(dataLayer);
      $(".gtm-update").click((e) => {
        pushMouseClickEvents(e, dataLayer);
      });
    }
  }

  function pushCurrentPage(dataLayer) {
    const currentPage = $("body").attr("class");
    const event = buildEvents('currentPage', currentPage);
    pushToGtm(dataLayer, event);
  }

  function pushMouseClickEvents(e, dataLayer) {
    // 'innerText' for buttons, links, etc.
    // 'value' for inputs
    // 'alt' for elements without text value (elements that use images instead of text, for example )
    const label = e.target.innerText || e.target.value || e.target.alt;
    const event = buildEvents('buttonClicked', label);
    pushToGtm(dataLayer, event);
  }

  function buildEvents(eventKey, eventValue) {
    const events = {};
    Object.assign(events, { event: 'ario', [eventKey]: eventValue });

    return events;
  }

  function pushToGtm(dataLayer, event) {
    dataLayer.push(event);
  }
});
