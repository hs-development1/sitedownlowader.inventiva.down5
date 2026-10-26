(function($, Drupal) {

  $(document).ready(() => {
    if(window.location.hash !== '') {
      history.replaceState(null, '', window.location.href.split('#')[0])
    }
  })

  $(window).scroll(() => {
    const GrpLinks = Array.from(document.querySelectorAll('.playbook-menu__group_active .playbook-menu__link'))
    const GrpLinksLen = 0
    let GrpLinksCurrent = GrpLinksLen
    if(GrpLinks.length > 0) {
      const WindowHeightPoint = (window.innerHeight * 0.5)
      GrpLinks.map((GrpLinkItm, GrpLinkIndx) => {
        if(GrpLinkIndx !== 0) {
          const LinkHref = $(GrpLinkItm).attr('href')
          if(LinkHref.includes('#')) {
            const { 1: Hash } = LinkHref.split('#')
            const HashElem = document.querySelector(`#${Hash}`)
            if(HashElem != null) {
              const HashElemTop = HashElem.getBoundingClientRect().top
              if(HashElemTop < WindowHeightPoint) {
                GrpLinksCurrent = GrpLinkIndx
              }
            }
          }
        }
      })
    }
    GrpLinks.map((GrpLinkItm, GrpLinkIndx) => {
      if(GrpLinksCurrent === GrpLinkIndx) {
        GrpLinkItm.classList.add('playbook-menu__link_active')
      } else {
        GrpLinkItm.classList.remove('playbook-menu__link_active')
      }
    })
  })

  $(document).on('click', '.playbook-menu__link', function(E) {
    const Href = $(this).attr('href')

    if(Href.includes('#')) {
      const { 0: Path, 1: Hash } = Href.split('#')
      if(Path === window.location.pathname) {
        E.preventDefault()

        const HashElem = $(`#${Hash}`)
        if(HashElem.length === 1) {
          let HeaderGap = 0
          const HeaderElem= document.querySelector('.creatio-header-menu')
          if(HeaderElem != null) { HeaderGap = (HeaderElem.getBoundingClientRect().bottom) }

          $('html, body').animate({
            scrollTop: (HashElem.offset().top - HeaderGap - 20)
          }, 500)
        }
      }
    }
  })
} (jQuery, Drupal))
