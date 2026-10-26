(function ($, Drupal) {
  'use strict';

  /**
   * Behavior description.
   */
  let flag = false;
  let iti = null;
  let preferredCountries = ['us', 'ca', 'gb'];
  let initialCountry = 'us';
  if(drupalSettings.path.currentLanguage === 'uk') {
    preferredCountries = ['ua'];
    initialCountry = 'ua';
  } else if(drupalSettings.path.currentLanguage === 'ru') {
    preferredCountries = ['kz'];
    initialCountry = 'kz';
  }
  let DataSent = false;

  const QueryParams = [
    { k: 'activity', f: 'field_lead_marketingactivity' },
    { k: 'utm_campaign', f: 'field_lead_utmcampaign' },
    { k: 'utm_medium', f: 'field_lead_utmmedium' },
    { k: 'utm_source', f: 'field_lead_utmsource' },
    { k: 'utm_content', f: 'field_lead_utmcontent' },
  ]

  Drupal.behaviors.form_creatio = {
    attach: function (context, settings) {
      const bpmRef  = $.cookie('bpmRef');
      const bpmHref  = $.cookie('bpmHref');
      const bpmTrackingId  = $.cookie('bpmTrackingId');
      if(typeof bpmRef !== 'undefined' && bpmRef.length) {
        $('form input[name="field_lead_bpmref"]', context).once('form_creatio_set_value').val(bpmRef);
      }
      if(typeof bpmHref !== 'undefined') {
        $('form input[name="field_lead_bpmhref"]').once('form_creatio_set_value').val(bpmHref);
      }
      if(typeof bpmTrackingId !== 'undefined') {
        $('form input[name="field_lead_bpmsessionid"]').once('form_creatio_set_value').val(bpmTrackingId);
      }

      $('.form-item', context).each(function() {
        const item = $(this);
        if(item.find('input').length && item.find('input').val().length) {
          item.addClass('focus');
        }
      });

      $('.form-item .error').once('onceEachError').each(function() {
        const item = $(this).closest('.form-item');
        const form = item.closest('form');
        const label = item.find('label:not(.error)').html();
        const messages = [];
        const messagesError = form.find('.messages--error').length ? form.find('.messages--error') : $('.region-content > div[data-drupal-messages] .messages--error');
        if(messagesError.find('.messages__list').length) {
          messagesError.find('.messages__item').each(function() {
            const message = $(this);
            messages[messages.length] = message.text().trim();
          });
        } else {
          const message = messagesError.find('div[role="alert"]');
          message.find('h2').remove();
          messages[messages.length] = message.text().trim();
        }

        if(messages.length) {
          setInputError(messages, label, item);
        }
      });

      $('form input.form-tel', context).each(function() {
        const input = $(this);
        if(!input.closest('.iti').length) {
          iti = window.intlTelInput(input[0], {
            utilsScript: 'https://cdn.jsdelivr.net/gh/jackocnr/intl-tel-input@v17.0.13/build/js/utils.js',
            nationalMode: false,
            preferredCountries: preferredCountries,
            excludeCountries: ['BY', 'CU', 'ER', 'RU', 'IR', 'LY', 'KP', 'SO', 'SD', 'SS', 'SY', 'VE', 'YE', 'ZW'],
            initialCountry: initialCountry
          });
        } else {
          iti = window.intlTelInputGlobals.instances[0];
        }
        setTimeout(() => {
          input.val('');
        }, 1);
      });

      $('input.form-tel', context).bind('input keyup', function() {
        const input = $(this);
        let value = input.val();
        value = value.replace(/[^+()\s\-\d]+/g, '');
        value = value.substring(0, 1) + value.substring(1).replace(/\+/g, '');
        input.val(value);
      }).bind('focus', function() {
        const input = $(this);
        if(!input.val().length && typeof iti.getSelectedCountryData().dialCode !== 'undefined') {
          input.val('+'+iti.getSelectedCountryData().dialCode);
        }
      }).bind('open:countrydropdown', function() {
        $(this).addClass('focus');
      }).bind('close:countrydropdown', function() {
        $(this).removeClass('focus');
      });

      const country = $('select[name="field_lead_country"]', context);
      if(country.length && typeof window.intlTelInputGlobals !== 'undefined') {
        country.find('option').each(function() {
          const option = $(this);
          let val = option.val();
          if(val.length) {
            if(val === 'USA') {
              val = 'United States';
            } else if(val === 'UAE') {
              val = 'United Arab Emirates';
            }

            $.each(window.intlTelInputGlobals.getCountryData(), function(index, value) {
              if(value.name.indexOf(val) > -1) {
                option.attr('data-country-code', value.iso2);
                option.attr('data-dial-code', value.dialCode);
              }
            });
          }
        });
      }

      $(document).on('click', '.iti .iti__country', function() {
        const item = $(this);
        let val = $('select[name="field_lead_country"] option[data-country-code="'+item.data('country-code')+'"]').val();
        if(typeof val !== 'undefined') {
          $('select[name="field_lead_country"]').val(val).trigger('change');
        }
      });

      $('form select').once().each((index, item) => {
        const select = $(item);
        const closeOnSelect = select.attr('multiple') === undefined;
        select.select2({
          closeOnSelect: closeOnSelect,
          dropdownPosition: 'below',
          dropdownParent: select.closest('.js-form-type-select'),
          minimumResultsForSearch: 10,
          placeholder: null,
          templateResult: formatState
        }).on('select2:open', function() {
          const $this = $(this);
          $this.closest('.form-item').addClass('open');
        }).on('select2:open', function() {
          const $this = $(this);
          if(typeof $this.data('search') !== 'undefined' && $this.data('search') === 1) {
            $('.select2-search').addClass('select2-search_show');
          }
          $this.closest('.form-item').addClass('open');
        }).on('select2:close', function() {
          const $this = $(this);
          $this.closest('.form-item').removeClass('open');
        }).bind('change', function() {
          const $this = $(this);
          const $formItem = $this.closest('.form-item');
          if($this.val() === '') {
            $formItem.removeClass('focus');
          } else {
            $formItem.addClass('focus');
            if($this.hasClass('required')) {
              $this.removeClass('error');
            }
          }

          if($this.attr('name') === 'field_lead_country' && iti !== null && flag) {
            const inputTel = $this.closest('form').find('input.form-tel');
            if(inputTel.length) {
              for(const [key, item] of Object.entries(window.intlTelInputGlobals.instances)) {
                if(inputTel.attr('id') === item.a.id) {
                  iti = item;
                }
              }
            }

            let countryCode = $this.find('option:selected').data('country-code'), val;
            const dialCode = $this.find('option:selected').data('dial-code');
            const input = $this.closest('form').find('input.form-tel');
            if(typeof countryCode === 'undefined' && typeof dialCode === 'undefined') {
              countryCode = '';
              val = '+';
            } else {
              if(typeof iti.getSelectedCountryData().dialCode === 'undefined') {
                val = '+'+dialCode;
              } else {
                try {
                  val = input.val().replace('+'+iti.getSelectedCountryData().dialCode, '+'+dialCode);
                }
                catch (e) {

                }
              }
            }
            iti.setCountry(countryCode);
            input.val(val);
          }

          flag = true;
        });

        if(!select.closest('.view-filters').length && !select.closest('.views-exposed-form').length && !select.closest('.checkout').length) {
          select.trigger('change');
        }
      });

      $('form .form-type-select:has(select[multiple]) label').once('clickSelectLabel').bind('click', (e) => {
        const el = $(e.target).closest('.form-type-select');
        const select2 =el.find('.select2');
        if(select2.length) {
          el.toggleClass('opened');
          if(el.hasClass('opened')) {
            el.find('select').select2('open');
          }
        }
      });

      $('.form-item input', context).bind('focus', function() {
        const $this = $(this);
        $this.closest('.form-item').addClass('focus');
      }).bind('blur', function() {
        const $this = $(this);
        if(!$this.val().length) {
          $this.closest('.form-item').removeClass('focus');
        }
      });

      $('.form-type-managed-file').each(function() {
        const elem = $(this);
        if(elem.find('.file').length) {
          elem.addClass('with-file');
        }
      });

      $('.webform-submission-form .form-actions .form-submit').bind('mousedown', function() {
        if(!$(this).closest('.creatio-footer-newsletter').length) {
          const actions = $(this).closest('.form-actions');
          if(!actions.find('.form-loader').length) {
            $(this).addClass('hover');
            actions.append('<div class="form-loader"></div>');
            if(actions.closest('.ui-dialog').length && actions.closest('.ui-dialog').find('.ui-dialog-buttonset').length) {
              actions.closest('.ui-dialog').find('.ui-dialog-buttonset').append('<div class="form-loader"></div>');
            }
          }
        }
      });

      $('form:not(.checkout):not(.webform-submission-form) .form-actions .form-submit', context).bind('mousedown', function() {
        if(!$(this).closest('.views-exposed-form').length) {
          const actions = $(this).closest('.form-actions');
          if(!actions.find('.form-loader').length) {
            actions.append('<div class="form-loader"></div>');
          }
        }
      });

      $('form').find('[type="tel"], [type="text"], [type="email"], textarea, select').once('formInputChange').bind('change', (e) => {
        const el = $(e.target);
        el.toggleClass('not-empty', !!el.val().length && el.val() !== '+');
      });
      $('form:not([id^=views-exposed-form]):not(.checkout)').find('[type="tel"], [type="text"], [type="email"], textarea, select').trigger('change');
    }
  };

  $(window).on('dialog:aftercreate', function(d, e, s) {
    const { search: SearchString } = window.location
    if(SearchString !== '') {
      const SearchParams = new URLSearchParams(SearchString)

      let Elem = s[0]
      if(Elem !== undefined && Elem !== null) {
        QueryParams.map(QueryParam => {
          const QueryVal = SearchParams.get(QueryParam.k)
          if(typeof QueryVal === 'string' && QueryVal.length > 0) {
            let QueryElem = $(Elem).find('form input[name="' + QueryParam.f + '"]');
            if (QueryElem.length) { QueryElem.attr('value', QueryVal); }
          }
        })
      }
    }
  });

  $(document).ajaxComplete((event, xhr, settings) => {
    const dialog = $('.ui-dialog_creatio:not(.creatio-popup)');
    if(dialog.length) {
      const text = dialog.find('.webform-submission-form .form-actions').next();
      if(text.hasClass('form-type-processed-text')) {
        if(!dialog.find('.ui-dialog-buttonpane .form-type-processed-text').length) {
          dialog.find('.ui-dialog-buttonpane').append(text[0].outerHTML);
        }
        text.remove();
      }

      const pdf = dialog.find('.ts-download-pdf');
      if(pdf.length && !dialog.find('.ui-dialog-buttonpane .ts-link').length) {
        const actions = dialog.find('.ui-dialog-buttonpane .form-actions');
        if(actions.length && !actions.find('.button').text().length) {
          actions.remove();
        }
        dialog.find('.ui-dialog-buttonpane').append(pdf.html());
        pdf.remove();
      }
    }

    // SENDING DATA TO 'dataLayer' AFTER SUBMIT SECOND-STEP OF TRIAL FORM
    let TrialError = $('.trial .trial-message');
    let TrialSlider = $('.trial .trial-slider');
    setTimeout(() => {
      if(window.location.pathname.includes('/trial') && !DataSent) {
        if(TrialError.length > 0 || TrialSlider.length > 0) {
          let ParamsObj = {};
          let Params = window.location.search.substr(1).split('&');
          Params.map(param => {
            let Param = param.split('=');
            ParamsObj[Param[0]] = Param[1];
          });

          if(ParamsObj.product !== undefined && ParamsObj.product.length > 0) {
            let FormName = '';
            ParamsObj.product.includes('studio') && (FormName = 'trial_studio');
            ParamsObj.product.includes('sales') && (FormName = 'trial_sales');
            ParamsObj.product.includes('marketing') && (FormName = 'trial_marketing');
            ParamsObj.product.includes('service') && (FormName = 'trial_service');
            ParamsObj.product.includes('ent-marketing-service') && (FormName = 'trial_crm');

            dataLayer.push ({ 'event': 'send_form', 'form_name': FormName, });
            DataSent = true;
          }
        }
      }
    }, 500);
  });

  function formatState(state) {
    const desc = $(state.element).data('desc');
    if(typeof desc === 'undefined') {
      return state.text;
    } else {
      return $('<div class="option"><div class="option__title">'+state.text+'</div><div class="option__desc">'+desc+'</div></div>');
    }
  }

  function setInputError(messages, label, item) {
    if(!item.find('label.error').length) {
      let error = '';

      messages.forEach(message => {
        if(message.indexOf(label) > -1) {
          error = message.replace(label, '').trim();
          const firstLetter = error.substring(0, 1).toUpperCase();
          error = firstLetter + error.substring(1);
        } else if(!error.length && item.find('input').length && item.find('input').val().length && message.indexOf(item.find('input').val()) > -1) {
          error = message;
        }
      });

      if(error.length) {
        if(error.substring(error.length-1) === '.') {
          error = error.substring(0, error.length-1);
        }
        item.append('<label class="error">'+error+'</label>');
      }
    }
  }

} (jQuery, Drupal));
