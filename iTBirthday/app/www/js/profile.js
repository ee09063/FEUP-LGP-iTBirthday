angular.module('itBirthday.profile', ['ngFileUpload'])

  .controller('SearchCtrl', ['$scope', '$http', 'ionicLoadingService', function ($scope, $http, ionicLoadingService) {
    $scope.serverUrl = serverUrl;
    $scope.defaultImageURL = serverUrl + "/images/employees/default.png";

    $scope.getAllEmployees = function () {
      ionicLoadingService.showLoading();

      $http.get(serverUrl + '/list_employees').success(function (response) {
        for (var i = 0; i < response.length; i++) {
          var pro = response[i];
          pro.imageURL = serverUrl + "/images/employees/" + pro.photoPath;
        }
        $scope.profiles = response;

        ionicLoadingService.hideLoading();
      });
    };

    var searchLabel = $($("#search-label").find("> input")[0]);
    var statusFilter = $("#status-filter").find("> select")[0];

    $scope.filterResults = function (element) {
      var status = statusFilter.options[statusFilter.selectedIndex].value;
      if (status != undefined) {

        var exitDate = element["exitDate"];

        if (status == "now" && exitDate) {
          return false;
        }

        if (status == "old" && !exitDate) {
          return false;
        }
      }

      var searchTerm = searchLabel.val();
      if (searchTerm == undefined || searchTerm.length == 0) {
        return true;
      }

      searchTerm = searchTerm.toLowerCase().trim();

      if (element["name"].toLowerCase().search(searchTerm) >= 0) {
        return true;
      }

      var emailWithoutHost = element["email"].substring(0, Math.max(0, element["email"].search(/@/) - 1));

      return (emailWithoutHost.toLowerCase().indexOf(searchTerm) >= 0);
    };

  }])

  .controller('UpdateUserCtrl', function ($scope, $http, $state, $stateParams, $ionicPopup, Upload, ionicLoadingService) {
    $scope.profile = {};
    $scope.isView = null;
    $scope.notCreating = null;
    $scope.serverUrl = serverUrl;
    $scope.changedPhoto = false;
    $scope.imageURL = null;
    $scope.defaultImageURL = serverUrl + "/images/employees/default.png";

    $scope.isChoosingExitDate = false;
    $scope.hasExited = false;

    $scope.toggleShowExitDate = function () {
      $scope.isChoosingExitDate = !$scope.isChoosingExitDate;
    };

    // A confirm dialog
    $scope.showConfirmRemove = function () {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Remover perfil',
        cssClass: 'profile-confirm-popup',
        template: 'Tem a certeza que quer remover este perfil? (Esta ação é irreversível)',
        cancelText: 'Cancelar',
        cancelType: 'button-dark',
        okText: 'Sim',
        okType: 'button-assertive'
      });

      confirmPopup.then(function (res) {
        if (res) {
          $http.post(serverUrl + '/delete_employee', {
            email: $scope.profile.email
          }).success(function (data, status) {
            if (status == 200) {
              var errorPopup = $ionicPopup.alert({
                title: "Perfil não encontrado!",
                cssClass: "profile-alert-popup",
                template: 'Tentou eliminar um perfil que não existe.'
              });

              errorPopup.then(function() {
                $state.go('tabs.dash');
              });
            } else if (status == 202) {
              var successPopup = $ionicPopup.alert({
                title: "Perfil eliminado!",
                cssClass: "profile-alert-popup",
                template: 'Perfil eliminado com sucesso.'
              });

              successPopup.then(function() {
                $state.go('tabs.dash');
              });
            }
            return true;
          }).error(function (err) {
            return false;
          });
        } else {
          return false;
        }
      });
    };

    // Triggered on a button click, or some other target
    $scope.showPopupExitDate = function () {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Adicionar data de saída',
        cssClass: 'profile-confirm-popup',
        template: 'Tem a certeza que quer adicionar uma data de saída? (Esta ação é irreversível)',
        cancelText: 'Cancelar',
        cancelType: 'button-dark',
        okText: 'Sim',
        okType: 'button-assertive'
      });

      confirmPopup.then(function (res) {
        if (res) {
          $scope.profile.sendMail = false;
          $scope.profile.sendPersonalizedMail = false;
          $scope.profile.mailText = "";
          $scope.profile.sendSMS = false;
          $scope.profile.sendPersonalizedSMS = false;
          $scope.profile.smsText = "";
          $scope.profile.facebookPost = false;

          $scope.update_profile_http_request();
        } else {
          return false;
        }
      });
    };

    $scope.showAlertProfile = function () {
      var alertPopup = $ionicPopup.alert({
        title: "Perfil não editado!",
        cssClass: "profile-alert-popup",
        template: 'Tem os seguintes erros no formulário de edição:' + wrongFields
      });
    };

    $scope.getEmployee = function () {
      ionicLoadingService.showLoading();

      $scope.isView = true;
      $scope.notCreating = true;
      $http.get(serverUrl + '/employee_profile/' + $stateParams.id).success(function (response) {
        $scope.profile = response;
        var photoPath = $scope.profile.photoPath;

        var birthDate = new Date(String($scope.profile.birthDate));
        var entryDate = new Date(String($scope.profile.entryDate));
        var dateNow = new Date();
        dateNow.setHours(12); // in the first hours of the day would count a day less without this
        var ageDate = new Date(dateNow - birthDate);
        var ageInEntry = new Date(entryDate - birthDate);

        $scope.profile.birthDate = birthDate.toISOString().slice(0, 10);
        $scope.profile.entryDate = entryDate.toISOString().slice(0, 10);
        $scope.profile.age = Math.abs(ageDate.getUTCFullYear() - 1970);

        $scope.imageURL = (serverUrl + "/images/employees/" + photoPath);

        if ($scope.profile.exitDate != undefined) {
          var exitDate = new Date(String($scope.profile.exitDate));
          exitDate.setHours(12); // default hour 1 a.m so the same problem

          $scope.profile.exitDate = exitDate.toISOString().slice(0, 10);
          $scope.profile.daysInCompany = Math.floor(Math.abs(exitDate - entryDate) / (1000 * 3600 * 24));

          var ageInExit = new Date(exitDate - birthDate);
          $scope.profile.birthdaysInCompany = Math.max(0, Math.abs(ageInExit.getUTCFullYear() - 1970) - Math.abs(ageInEntry.getUTCFullYear() - 1970));

          $scope.hasExited = true;

        } else {
          $scope.profile.daysInCompany = Math.floor(Math.abs(dateNow - entryDate) / (1000 * 3600 * 24));
          $scope.profile.birthdaysInCompany = Math.max(0, $scope.profile.age - Math.abs(ageInEntry.getUTCFullYear() - 1970));
        }

        ionicLoadingService.hideLoading();
      });
    };

    //listen for the file selected event
    $("input[type=file]").on("change", function () {
      $scope.profile.photo = this.files[0];
      $scope.changedPhoto = true;
    });

    //post request to the server to update profile
    $scope.update_profile_http_request = function () {
      ionicLoadingService.showLoading();
      var date = ($scope.profile.exitDate == undefined) ? undefined : new Date($scope.profile.exitDate);

      $http.post(serverUrl + '/update_employee/' + $stateParams.id, {
        name: $scope.profile.name,
        birthDate: new Date($scope.profile.birthDate),
        phoneNumber: $scope.profile.phoneNumber,
        email: $scope.profile.email,
        entryDate: new Date($scope.profile.entryDate),
        sendMail: $scope.profile.sendMail,
        mailText: $scope.profile.mailText,
        sendPersonalizedMail: $scope.profile.sendPersonalizedMail,
        sendSMS: $scope.profile.sendSMS,
        smsText: $scope.profile.smsText,
        sendPersonalizedSMS: $scope.profile.sendPersonalizedSMS,
        facebookPost: $scope.profile.facebookPost,
        gender: $scope.profile.gender,
        exitDate: date
      }).then(function () {
        if ($scope.profile.photo != undefined && $scope.changedPhoto == true) {
          Upload.upload({
            url: serverUrl + '/save_image_employee/' + $stateParams.id,
            file: $scope.profile.photo,
            progress: function (e) {
            }
          }).then(function (data, status, headers, config) {
            // file is uploaded successfully
            ionicLoadingService.hideLoading();
            $state.transitionTo($state.current, $stateParams, {reload: true, inherit: false, notify: true});
          }, function (err) {
            ionicLoadingService.hideLoading();
            $state.transitionTo($state.current, $stateParams, {reload: true, inherit: false, notify: true});
          });
        } else {
          ionicLoadingService.hideLoading();
          $state.transitionTo($state.current, $stateParams, {reload: true, inherit: false, notify: true});
        }
      }, function(err) {
        ionicLoadingService.hideLoading();
        $state.transitionTo($state.current, $stateParams, {reload: true, inherit: false, notify: true});
      });
    };

    $scope.update_profile = function (profileData) {
      $("input").css("border", "none");
      $("label").css("border", "none");
      $("textarea").css("border", "none");
      wrongFields = "";
      if (!VerifyProfileData(profileData)) {
        $scope.showAlertProfile();
        return false;
      }

      // if used so that if the user selects an exit date it has to confirm the update
      if ($scope.profile.exitDate != undefined && !$scope.hasExited) {
        $scope.showPopupExitDate();
      } else {
        $scope.update_profile_http_request();
      }
    };
  })

  .controller('NewUserCtrl', ['$scope', '$state', '$http', '$ionicPopup', 'Upload', 'ionicLoadingService',
    function ($scope, $state, $http, $ionicPopup, Upload, ionicLoadingService ) {
      $scope.profile = {};
      $scope.serverUrl = serverUrl;
      $scope.defaultImageURL = serverUrl + "/images/employees/default.png";

      $scope.getEmployee = function () {
        $scope.isView = false;
        $scope.isNewProfile = true;
      };

      //listen for the file selected event
      $("input[type=file]").on("change", function () {
        $scope.profile.photo = this.files[0];
      });

      $scope.showAlertProfile = function () {
        var alertPopup = $ionicPopup.alert({
          title: 'Perfil não criado!',
          cssClass: 'profile-alert-popup',
          template: 'Tem os seguintes erros no formulário de criação:' + wrongFields
        });
      };

      $scope.newProfile = function (profileData) {
        $("input").css("border", "none");
        $("label").css("border", "none");
        $("textarea").css("border", "none");
        wrongFields = "";
        if (!VerifyProfileData(profileData)) {
          $scope.showAlertProfile();
          return false;
        }

        ionicLoadingService.showLoading();

        $http.post(serverUrl + '/post_employee', {
          name: profileData.name,
          birthDate: new Date(profileData.birthDate),
          phoneNumber: profileData.phoneNumber,
          email: profileData.email,
          entryDate: new Date(profileData.entryDate),
          sendMail: profileData.sendMail,
          sendPersonalizedMail: profileData.sendPersonalizedMail,
          mailText: profileData.mailText,
          sendSMS: profileData.sendSMS,
          sendPersonalizedSMS: profileData.sendPersonalizedSMS,
          smsText: profileData.smsText,
          facebookPost: profileData.facebookPost,
          gender: profileData.gender
        }).success(function (data) {
          if (profileData != undefined) {
            Upload.upload({
              url: serverUrl + '/save_image_employee/' + data,
              file: profileData.photo,
              progress: function (e) {
              }
            }).then(function (data, status, headers, config) {
              // file is uploaded successfully
            });
          }
          ionicLoadingService.hideLoading();

          $state.go('tabs.dash');
          return true;
        }).error(function (err) {
          ionicLoadingService.hideLoading();
          return false;
        });
      }
    }])

  /**
   * jquery date picker directive
   */
  .directive('datepicker', function () {
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ngModelCtrl) {
        $(function () {
          $(element).datepicker({
            changeYear: true,
            changeMonth: true,
            dateFormat: 'yy-mm-dd',
            yearRange: "-100:+1",
            onSelect: function (dateText, inst) {
              ngModelCtrl.$setViewValue(dateText);
              scope.$apply();
            }
          });
        });
      }
    }
  })

  .directive('errSrc', function () {
    return {
      link: function (scope, element, attrs) {
        element.bind('error', function () {
          if (attrs.src != attrs.errSrc) {
            attrs.$set('src', attrs.errSrc);
          }
        });
      }
    }
  });

var wrongFields = "";

/**
 * @return {boolean}
 */
var VerifyProfileData = function (profileData) {
  var allOk = true;

  if (profileData == undefined) {
    $("#checkedFields").find("input").css("border", "1px solid #FF9A9A");
    $("label#gender").css("border", "1px solid #FF9A9A");
    wrongFields = "<span>Erro geral</span>";
    return false;
  }

  if (profileData.name == undefined || profileData.name.length == 0) {
    $("input#name").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Nome: <b>campo vazio</b>";
    allOk = false;
  } else if (!IsCharLetter(profileData.name[0])) {
    $("input#name").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Nome: <b>tem de começar por uma letra</b>";
    allOk = false;
  }

  if (profileData.gender == undefined) {
    $("label#gender").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Sexo: valor inválido";
    allOk = false;
  }

  if (profileData.phoneNumber == undefined || profileData.phoneNumber.length == 0) {
    $("input#phoneNumber").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Telefone/Telemóvel: <b>campo vazio</b>";
    allOk = false;
  } else if(!IsProperPhoneNumber(profileData.phoneNumber)) {
    $("input#phoneNumber").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Telefone/Telemóvel: <b>tem de ter 9 dígitos numéricos</b>";
    allOk = false;
  } else {
    profileData.phoneNumber = GetFormattedPhoneNumber(profileData.phoneNumber);
  }

  if (profileData.email == undefined || profileData.email.length == 0) {
    $("input#email").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Endereço de Email: <b>valor inválido</b>";
    allOk = false;
  }

  if (profileData.birthDate == undefined || profileData.birthDate.length == 0) {
    $("input#birthDate").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Data de Nascimento: <b>valor inválido</b>";
    allOk = false;
  }

  if (profileData.entryDate == undefined || profileData.entryDate.length == 0) {
    $("input#entryDate").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Data de Admissão: <b>valor inválido</b>";
    allOk = false;
  }

  if (profileData.sendMail == undefined) {
    $("#send_mail").find(".checkbox i:before").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Email de Aniversário: <b>valor inválido</b>";
    allOk = false;
  } else if (profileData.sendMail == true) {
    if (profileData.sendPersonalizedMail == undefined) {
      allOk = false;
    } else if (profileData.sendPersonalizedMail == true) {
      if (profileData.mailText == undefined) {
        wrongFields += "<br>- Mensagem de Email personalizada;";
        $("textarea#emailCustom").css("border", "1px solid #FF9A9A");
        allOk = false;
      } else {
        var mailTextTrimmed = profileData.mailText.trim();
        if (mailTextTrimmed.length == 0) {
          wrongFields += "<br>- Mensagem de Email personalizada;";
          $("textarea#emailCustom").css("border", "1px solid #FF9A9A");
          allOk = false;
        } else {
          profileData.mailText = mailTextTrimmed;
        }
      }
    } else {
      profileData.mailText = "";
    }
  } else {
    profileData.sendPersonalizedMail = false;
    profileData.mailText = "";
  }

  if (profileData.sendSMS == undefined) {
    $("#send_sms").find(".checkbox i:before").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- SMS de Aniversário: <b>valor inválido</b>";
    allOk = false;
  } else if (profileData.sendSMS == true) {
    if (profileData.sendPersonalizedSMS == undefined) {
      allOk = false;
    } else if (profileData.sendPersonalizedSMS == true) {
      if (profileData.smsText == undefined) {
        wrongFields += "<br>- SMS personalizada;";
        $("textarea#smsCustom").css("border", "1px solid #FF9A9A");
        allOk = false;
      } else {
        var smsTextTrimmed = profileData.smsText.trim();
        if (smsTextTrimmed.length == 0) {
          wrongFields += "<br>- SMS personalizada;";
          $("textarea#smsCustom").css("border", "1px solid #FF9A9A");
          allOk = false;
        } else {
          profileData.smsText = smsTextTrimmed;
        }
      }
    } else {
      profileData.smsText = "";
    }
  } else {
    profileData.sendPersonalizedSMS = false;
    profileData.smsText = "";
  }

  if (profileData.facebookPost == undefined) {
    $("#send_facebook").find(".checkbox i:before").css("border", "1px solid #FF9A9A");
    wrongFields += "<br>- Post de Facebook: <b>valor inválido</b>";
    allOk = false;
  }

  return allOk;
};

/**
 * @return {boolean}
 */
var IsCharNumber = function (char) {
  return (char >= '0' && char <= '9');
};

/**
 * @return {boolean}
 */
var IsCharLetter = function (char) {
  return ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z'));
};

/**
 * @return {string}
 */
var GetFormattedPhoneNumber = function (number) {
  var parcels = number.split(" ");

  var finalNumber = "";

  for (var i = 0; i < parcels.length; i++) {
    finalNumber += parcels[i];
  }

  return finalNumber;
};

/**
 * @return {boolean}
 */
var IsProperPhoneNumber = function (text) {
  if(text.length != 9) {
    return false;
  }

  for(var i = 0; i < text.length; i++) {
    var n = text[i];
    if(!IsCharNumber(n)) {
      return false;
    }
  }

  return true;
};

/**
 * @return {boolean}
 */
var isLeapYear = function (year) {
  return (new Date(year, 1, 29).getMonth() == 1);
};
