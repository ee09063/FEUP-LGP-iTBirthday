angular.module('itBirthday.settings', ['ngFileUpload'])

  .controller('MsgTemplatesCtrl', function ($scope, $state, $stateParams, $http, Upload, $ionicPopup, $ionicSlideBoxDelegate, ionicLoadingService) {
    $scope.index = 0;
    $scope.defaultMsg = {};
    $scope.responseCount = 0;
    $scope.errCount = 0;
    $scope.wrongFields = "";
    $scope.index_default_banner = 0;

    $scope.makeDefault = function () {
      $scope.index_default_banner = $scope.index;
    };

    $scope.next = function () {
      $ionicSlideBoxDelegate.next();
      $scope.index = $ionicSlideBoxDelegate.currentIndex();
    };

    $scope.previous = function () {
      $ionicSlideBoxDelegate.previous();
      $scope.index = $ionicSlideBoxDelegate.currentIndex();
    };

    // Called each time the slide changes
    $scope.slideHasChanged = function (index) {
      $scope.index = index;
    };

    $scope.showAlertProfile = function () {
      $ionicPopup.alert({
        title: 'Template: erros na atualização!',
        cssClass: "template-alert-popup",
        template: 'Os seguintes erros foram detetados:' + $scope.wrongFields
      });
    };

    $scope.showConfirmPopup = function () {
      $ionicPopup.alert({
        title: 'Template atualizados!',
        cssClass: "template-alert-popup"
      });
    };

    //listen for the file selected event
    $("input[type=file]").on("change", function () {
      $scope.banner = this.files[0];
    });

    $scope.getDefaultMsg = function () {
      ionicLoadingService.showLoading();

      $scope.defaultMsg.email = "";
      $scope.defaultMsg.sms = "";
      $scope.defaultMsg.fb = "";
      $scope.banners = [];

      resetCounters();

      $scope.defaultMsgEmail_exists = false;
      var successCount = 0;

      $http.get(serverUrl + '/all_banners').success(function (response) {
        angular.forEach(response, function (value, key) {
          this.push(serverUrl + '/images/banners/' + value.path);
        }, $scope.banners);
        $ionicSlideBoxDelegate.update();
        successCount++;

        if (successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/email_template').success(function (response) {
        if (response != "") {
          $scope.defaultMsgEmail_exists = true;
          $scope.defaultMsg.email = response[0].text;
        }
        successCount++;

        if (successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/sms_template').success(function (response) {
        if (response != "") {
          $scope.defaultMsg.sms = response[0].text;
        }
        successCount++;

        if (successCount > 3)
          ionicLoadingService.hideLoading();
      });

      $http.get(serverUrl + '/facebook_template').success(function (response) {
        if (response != "") {
          $scope.defaultMsg.fb = response[0].text;
        }
        successCount++;

        if (successCount > 3)
          ionicLoadingService.hideLoading();
      });
    };

    $scope.saveChanges = function () {
      ionicLoadingService.showLoading();

      resetCounters();

      var emailTemplate = $scope.defaultMsg.email.trim();
      var smsTemplate = $scope.defaultMsg.sms.trim();
      var fbTemplate = $scope.defaultMsg.fb.trim();

      // Update default banner
      if ($scope.banners.size > 0) {
        $http.get(serverUrl + '/all_banners').then(function (response) {
            incrementSaveChangesResponses();

            var bannerIndex = 0;
            angular.forEach(response, function (value, key) {
              if (bannerIndex === $scope.index_default_banner) {
                $http.post(serverUrl + '/update_banner', {
                  id: value._id
                }).then(function () {
                  // Success: updated default template
                }, function (err) {
                  // Server error
                });
              }
              bannerIndex++;
            }, $scope.banners);
          }, function (err) {
            incrementSaveChangesResponses();
          });
      } else {
        incrementSaveChangesResponses();
      }

      // Update email template
      if (emailTemplate != undefined && emailTemplate != '') {
        if ($scope.defaultMsgEmail_exists == false) {
          $http.post(serverUrl + '/post_email_template', {
            text: emailTemplate
          }).then(function (success) {
            incrementSaveChangesResponses();
          }, function (err) {
            incrementSaveChangesResponses();
          });
        } else
          $http.post(serverUrl + '/update_email_template', {
            text: emailTemplate
          }).then(function (success) {
            incrementSaveChangesResponses();
          }, function (err) {
            incrementSaveChangesResponses();
          });
      } else {
        incrementSaveChangesErrCount('Email template: campo vazio;', $("textarea#emailMsg"));
      }

      // Add new banner
      if ($scope.banner != undefined) {
        Upload.upload({
          url: serverUrl + '/post_banner_template/',
          file: $scope.banner,
          progress: function (e) {
          }
        }).then(function (data, status, headers, config) {
          incrementSaveChangesResponses();
        }, function (err) {
          incrementSaveChangesResponses();
        });
      } else {
        incrementSaveChangesResponses();
      }

      // Update SMS template
      if (smsTemplate != undefined && smsTemplate != '') {
        $http.post(serverUrl + '/update_sms_template', {
          text: smsTemplate
        }).then(function (success) {
          incrementSaveChangesResponses();
        }, function (err) {
          incrementSaveChangesResponses();
        });
      } else {
        incrementSaveChangesErrCount('SMS template: campo vazio', $("textarea#smsMsg"));
      }

      // Update Facebook template
      if (fbTemplate != undefined && fbTemplate != '') {
        $http.post(serverUrl + '/update_facebook_template', {
          text: fbTemplate
        }).then(function () {
          incrementSaveChangesResponses();
        }, function (err) {
          incrementSaveChangesResponses();
        });
      } else {
        incrementSaveChangesErrCount('Facebook template: campo vazio', $("textarea#fbMsg"));
      }
    };

    var resetCounters = function () {
      $scope.responseCount = 0;
      $scope.errCount = 0;
      $scope.wrongFields = '';
      $("textarea").css("border", "none");
    };

    var incrementSaveChangesResponses = function () {
      $scope.responseCount++;

      if ($scope.responseCount >= 5) {
        ionicLoadingService.hideLoading();
        $state.transitionTo($state.current, $stateParams, {reload: true, inherit: false, notify: true});

        if ($scope.errCount > 0) {
          $scope.showAlertProfile();
        }
      }
    };

    var incrementSaveChangesErrCount = function (message, $element) {
      $scope.errCount++;
      $scope.wrongFields += ('<br>- ' + message);
      $element.css("border", "1px solid #FF9A9A");
      incrementSaveChangesResponses();
    };
  });
