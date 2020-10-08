(function() {
  var LoginController;

  LoginController = (function($) {
    return {
      init: function() {
        this.$loginBox = $("#login_box");
        this.$loginForm = $("#login_form");
        this.$errorContainer = $("#form_errors");
        this.$loginLittleCloud = $("#login_little_cloud");
        this.$ssoLinkContainer = $("#sso_link_container");
        this.positionLoginBox();
        this.bindEvents();
        this.addValidations();
        $(window).resize((function(_this) {
          return function() {
            return _this.positionLoginBox();
          };
        })(this));
        $('#clear_company').click((function(_this) {
          return function() {
            return _this.clearCompany();
          };
        })(this));
        return this.animateLoginBox();
      },
      animateLoginBox: function() {
        var animationOptions;
        animationOptions = {
          duration: 700,
          easing: 'swing'
        };
        jQuery('#login_box').delay(1).animate({
          opacity: 1,
          top: '+=20px'
        }, _.extend(animationOptions, {
          complete: this.focusFirstEmptyField
        }));
        return jQuery('#login_little_cloud').delay(1).animate({
          opacity: 1
        }, animationOptions);
      },
      bindEvents: function() {
        this.bindSubmit();
        return this.bindCompanySSOCheck();
      },
      bindSubmit: function() {
        this.$loginForm.submit((function(_this) {
          return function(event) {
            return event.preventDefault();
          };
        })(this));
        return $("#organization, #username, #password, #remember_me").on('keydown', (function(_this) {
          return function(e) {
            if (e.keyCode === 13) {
              return _this.$loginForm.trigger('submit');
            }
          };
        })(this));
      },
      bindCompanySSOCheck: function() {
        var keyUpCompanySSOCheck;
        keyUpCompanySSOCheck = _.debounce((function(_this) {
          return function(event) {
            return _this.companySSOCheck(event);
          };
        })(this), 750);
        $("#organization").on('keyup', function(e) {
          return keyUpCompanySSOCheck(e);
        });
        return $("#organization").on('change', (function(_this) {
          return function(e) {
            return _this.companySSOCheck(e);
          };
        })(this));
      },
      focusFirstEmptyField: function() {
        var fields, firstEmpty;
        fields = $("#organization, #username, #password");
        firstEmpty = $(_.find(fields, function(field) {
          var val;
          val = $(field).val();
          return val === "";
        }));
        if (firstEmpty.length === 1) {
          return firstEmpty.focus();
        }
      },
      addValidations: function() {
        var throttledAttemptLogin;
        throttledAttemptLogin = _.throttle(((function(_this) {
          return function() {
            return _this.attemptLogin();
          };
        })(this)), 1000);
        this.validator = new tsFormValidator({
          button: this.$loginForm.find("#submit_button"),
          onSuccess: throttledAttemptLogin
        }, this.$loginForm, {
          disableErrorAlert: true
        });
        this.validator.add({
          object: $('#organization'),
          name: I18n.t('company_name'),
          validationType: VALIDATE_REQUIRED,
          validateOnBlur: true
        });
        this.validator.add({
          object: $('#username'),
          name: I18n.t('username'),
          validationType: VALIDATE_REQUIRED,
          validateOnBlur: true
        });
        return this.validator.add({
          object: $('#password'),
          name: I18n.t('password'),
          validationType: VALIDATE_REQUIRED,
          validateOnBlur: true
        });
      },
      attemptLogin: function() {
        var ajaxOptions, formData;
        if (this.formDisabled) {
          return false;
        }
        this.disableForm();
        this.$errorContainer.empty().hide();
        this.trimFields();
        this.convertSmartQuotesOnOrganization();
        formData = this.$loginForm.serializeArray();
        if ($("#organization").is('[disabled]')) {
          formData = formData.concat({
            name: 'company_name',
            value: $('#organization').val()
          });
        }
        ajaxOptions = {
          async: true,
          type: 'post',
          data: formData,
          error: (function(_this) {
            return function(response) {
              _this.renderAuthenticationError(response.errors);
              TS.utils.shakeElement(_this.$loginBox);
              return _this.enableForm();
            };
          })(this)
        };
        return tsAjax(this.$loginForm.attr('action'), ajaxOptions, {
          library: 'jQuery',
          failSilently: true
        });
      },
      enableForm: function() {
        this.formDisabled = false;
        return Button.get('submit_button').enable();
      },
      disableForm: function() {
        this.formDisabled = true;
        return Button.get('submit_button').disable({
          spin: true
        });
      },
      renderAuthenticationError: function(error) {
        var errorDiv;
        errorDiv = $(jQuery.parseHTML(JST['shared/validation_error']({
          error: error
        })));
        this.$errorContainer.html(errorDiv);
        return this.$errorContainer.show();
      },
      clearCompany: function() {
        $('#clear_company').hide();
        return $('#organization').removeAttr('disabled').val('').focus();
      },
      positionLoginBox: function() {
        var littleCloudTop, loginBoxTop, loginHalfHeight, winHalfHeight;
        loginHalfHeight = this.$loginBox.outerHeight() / 2;
        winHalfHeight = $(window).height() / 2;
        loginBoxTop = Math.max(-40, winHalfHeight - loginHalfHeight);
        this.$loginBox.css('top', loginBoxTop);
        littleCloudTop = Math.max(loginBoxTop - 40, 20);
        return this.$loginLittleCloud.css('top', littleCloudTop);
      },
      trimFields: function() {
        return _.each(jQuery('#organization, #username'), function(f) {
          return jQuery(f).val(jQuery(f).val().trim());
        });
      },
      convertSmartQuotesOnOrganization: function() {
        return jQuery('#organization').val(jQuery('#organization').val().replace(/\’/g, "'"));
      },
      companySSOCheck: function(event) {
        var $ssoLink, ajaxOptions, company_name;
        $ssoLink = this.$ssoLinkContainer.find("a.sso_link");
        company_name = $(event.target).val();
        if (!this.previousCompanyValue) {
          this.previousCompanyValue = company_name;
        } else {
          if (this.previousCompanyValue === company_name) {
            return;
          }
          this.previousCompanyValue = company_name;
        }
        ajaxOptions = {
          async: true,
          type: 'post',
          data: {
            company_name: company_name
          },
          error: (function(_this) {
            return function(response) {};
          })(this),
          success: (function(_this) {
            return function(response) {
              var animationDuration;
              if (response) {
                animationDuration = 250;
                if (response.sso_link) {
                  $ssoLink.attr('href', response.sso_link);
                  _this.$loginForm.find(" > :not('#organization_container')").fadeOut(animationDuration);
                  return setTimeout((function() {
                    return _this.$ssoLinkContainer.fadeIn();
                  }), animationDuration);
                } else {
                  if (_this.$ssoLinkContainer.is(':visible')) {
                    _this.$ssoLinkContainer.fadeOut(animationDuration);
                    return setTimeout((function() {
                      return _this.$loginForm.find(" > :not('#organization_container'):not('#form_errors')").fadeIn();
                    }), animationDuration);
                  }
                }
              }
            };
          })(this)
        };
        return tsAjax('/company_sso_check', ajaxOptions, {
          library: 'jQuery',
          failSilently: true
        });
      }
    };
  })(jQuery);

  jQuery(document).ready(function() {
    return LoginController.init();
  });

}).call(this);
