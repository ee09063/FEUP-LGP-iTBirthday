var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var monthsExtended = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho",
  "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

angular.module('itBirthday.statistics', ['chart.js'])
  .config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all line charts
    ChartJsProvider.setOptions('Line', {
      showLines: false,
      lineTension: 0,
      pointBackgroundColor: "#ECA04B",
      pointRadius: "5"
    });
  }])

  .controller('StatisticsCtrl', function ($scope, $http, $state, $stateParams, ionicLoadingService, 
    $ionicSlideBoxDelegate, $ionicModal) {
    $scope.serverUrl = serverUrl;
    $scope.data = {
      MFData: [0, 0],
      MFRatio: {},
      MFLabels: ["Mulheres", "Homens"],
      MFBackgroundColors: ["#F1F1F2", "#ECA04B"],
      AgeLabels: ["18-21", "21-25", "25-30", "30-40", "40+"],
      AgeColors: [{
        fillColor: "transparent",
        strokeColor: "#ECA04B"
      }],
      AgeGroups: [[0, 0, 0, 0, 0]],
      AverageTime: 0,
      BirthsByMonthRatio: [],
      BirthsByMonthTotal: [],
      Employees: [],
      MonthGroups: []
    };
    $scope.currentMonth = undefined;
    $scope.currentMonthBirthdays = [];

    $ionicModal.fromTemplateUrl('month_window.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.getStatistics = function () {
      ionicLoadingService.showLoading();

      $scope.data.MonthGroups = [];
      for (var i = 0; i < months.length; i += 2) {
        $scope.data.MonthGroups.push([months[i], months[i + 1]]);
      }

      $http.get(serverUrl + '/statistics').then(
        function (success) {
          var data = success.data;

          $scope.data.Employees = data.Employees;

          var monthBox = new Date().getMonth() >> 1;
          $ionicSlideBoxDelegate.slide(monthBox);
          $ionicSlideBoxDelegate.update();

          $scope.data.AverageTime = data.AverageTime;
          $scope.data.MFData = [data.MFTotal.Female, data.MFTotal.Male];
          $scope.data.MFRatio = data.MFRatio;
          $scope.data.AgeGroups = [[
            data.AgeGroups['18to21'],
            data.AgeGroups['21to25'],
            data.AgeGroups['25to30'],
            data.AgeGroups['30to40'],
            data.AgeGroups['40+']]];

          $scope.data.BirthsByMonthTotal = data.BirthsByMonthTotal;
          $scope.data.BirthsByMonthRatio = data.BirthsByMonthRatio;

          normalizeBirthsByMonthRatios();

          ionicLoadingService.hideLoading();
        }, function (err) {
          console.log(err);
          ionicLoadingService.hideLoading();
        });
    };

    $scope.goToProfile = function (emp_id) {
      $scope.modal.hide().then(function() {
        $state.go('tabs.profile.new').then(function() {
          $state.go('tabs.profile.show', {id: emp_id});
        });
      });
    }

    function normalizeBirthsByMonthRatios() {

      var size = ($.map($scope.data.BirthsByMonthTotal, function (elem) {
        return elem;
      })).length;

      var max = -1.0;
      var i = 0;
      for (i = 0; i < size; i++) {
        var val = $scope.data.BirthsByMonthTotal[months[i]];
        if (val >= max) {
          max = val;
        }
      }

      $scope.data.BirthsByMonthRatio = [];

      for (i = 0; i < size; i++) {
        var month = months[i];
        $scope.data.BirthsByMonthRatio[month] = (($scope.data.BirthsByMonthTotal[month] / max) * 100) + "%";
      }
    }

    $scope.getExtendedMonthName = function(month) {
      for(var i = 0; i < months.length; i++) {
        if(month == months[i]) {
          return monthsExtended[i];
        }
      }

      return "";
    };

    $scope.filterMonthEmployees = function (month) {
      return function (item) {
        var itemMonth = months[new Date(item.birthDate).getMonth()];
        return (month == itemMonth);
      };
    };

    $scope.getEmployeeImagePath = function (imgPath) {
      if (imgPath == undefined) {
        return serverUrl + "/images/employees/default.png";
      } else {
        return serverUrl + "/images/employees/" + imgPath;
      }
    };

    $scope.getCleanDate = function(fullDate) {
      var date = new Date(fullDate).toLocaleDateString();
      return date;
    };

    $scope.onMonthClicked = function(monthIndex, offset) {
      var month = (monthIndex * 2) + offset;

      if($scope.modal.isShown()) {
        $scope.modal.hide();
      } else {
        $scope.currentMonth = monthsExtended[month];
        $scope.currentMonthBirthdays = [];
        for(var i = 0; i < $scope.data.Employees.length; i++) {
          var emp = $scope.data.Employees[i];
          var empMonth = new Date(emp.birthDate).getMonth();
          if(empMonth == month) {
            $scope.currentMonthBirthdays.push(emp);
          }
        }
        $scope.modal.show();
      }
    };

    $scope.nextMonthGroup = function() {
      $ionicSlideBoxDelegate.next();
    };

    $scope.previousMonthGroup = function() {
      $ionicSlideBoxDelegate.previous();
    };
  });
