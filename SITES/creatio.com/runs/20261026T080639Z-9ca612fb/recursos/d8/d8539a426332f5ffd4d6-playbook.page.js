(function ($, Drupal) {
  'use strict';
  /**
   * Behavior description.
   */
  Drupal.behaviors.playbook_page = {
    attach: (context, settings) => {
      $('.playbook-menu__title', context).once().bind('click', (e) => {
        const group = $(e.target).closest('.playbook-menu__group');
        const menu = group.closest('.playbook-menu');
        menu.find('.playbook-menu__title_active').removeClass('playbook-menu__title_active');
        menu.find('.playbook-menu__items[style!="display: none"]').slideUp(300);
        group.find('.playbook-menu__title').toggleClass('playbook-menu__title_active');
        group.find('.playbook-menu__items').slideDown(300);
      });

      $('.playbook-content__collapse-item .playbook-content__subtitle', context).once().bind('click', (e) => {
        const item = $(e.target).closest('.playbook-content__collapse-item');
        item.find('.playbook-content__subtitle').toggleClass('playbook-content__subtitle_active');
        item.find('.playbook-content__collapse-cont').slideToggle(300);
      });

      $('.playbook-menu__toggle', context).once().bind('click', (e) => {
        const elem = $(e.target).closest('.playbook-menu__toggle');
        const html = $('html', context);
        elem.toggleClass('playbook-menu__toggle_open');

        if(elem.hasClass('playbook-menu__toggle_open')) {
          html.css('overflow', 'hidden');
        } else {
          setTimeout(() => {
            html.removeAttr('style');
          }, 300);
        }
        elem.closest('.playbook-menu').toggleClass('playbook-menu_open');
      });
    }
  };

  $(document).ready(() => {
    const menu = $('.playbook-menu');
    menu.sticky({
      topSpacing: parseInt($('body').css('padding-top')) + parseInt($('.creatio-header-menu').height()) + 30,
      bottomSpacing: parseInt($('footer').height()) + 40,
      wrapperClassName: 'playbook-menu-wrap'
    });
  });

  let startX = 0, endX = 0, minStep = 100;
  document.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].pageX;
  }, false);
  document.addEventListener('touchend', (e) => {
    endX = e.changedTouches[e.changedTouches.length-1].pageX;
    const header = $('.creatio-mobile-header');
    const menu = $('.playbook-menu');

    if(endX > startX && endX - startX > minStep) {
      if(header.css('display') === 'block' && !menu.hasClass('playbook-menu_open')) {
        $('.playbook-menu__toggle').trigger('click');
      }
    } else if(endX < startX && startX - endX > minStep) {
      if(header.css('display') === 'block' && menu.hasClass('playbook-menu_open')) {
        $('.playbook-menu__toggle').trigger('click');
      }
    }
  }, false);


} (jQuery, Drupal));
