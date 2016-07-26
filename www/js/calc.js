var LC = 'F,D-,D,D+,C-,C,C+,B-,B,B+,A-,A,A+'.split(','),
  XC = {
    '1': 0,
    '7': 1,
    '10': 2,
    '13': 3,
    '17': 4,
    '20': 5,
    '23': 6,
    '27': 7,
    '30': 8,
    '33': 9,
    '37': 10,
    '40': 11,
    '43': 12
  },
  timer = 0,
  $grades = $('#grades');

$('body')
  .bind('ajaxStart', function () {
    $('body').append('<p class="loading">저장 중이에요~</p>');
  })
  .bind('ajaxStop', function () {
    $('.loading').remove();
  })
  .bind('ajaxError', function (error, xhr) {
    if (xhr.status >= 200)
      $('body').append('<p class="failed">서버와의 통신에 문제가 있어 저장하지 못했어요.</p>');
  });

function toGPAString(n) {
	return (n || 0).toFixed(2);
}

function calc() {
    var credits = [], grade = [],
        subtotal  = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        subdiv    = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        subweight = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        count     = [0,0,0,0,0,0,0,0,0,0,0,0,0],
        total = 0, div = 0, weight = 0, points = [];

    $grades.find('input[name^=c]').each(function (i) {
        credits[i] = parseFloat(this.value) || 0;
    });

    $grades.find('select').each(function (i) {
        grade[i] = parseInt($(this).val()) || 0;
    });

    for (var i = 0; i < 240; ++i) {
        var sem = i / 12 | 0;
        if (grade[i] > 0) { // except P
            subdiv[sem] += credits[i];
            ++count[XC[grade[i]]];
        }
        if (grade[i] != 1) { //except F
            subtotal[sem] += credits[i];
            subweight[sem] += credits[i] * grade[i];
        }
    }

    for (var i = 0; i < 20; ++i) {
        var subgpa = subweight[i] / (subdiv[i] * 10);
        $('#subgpa' + i).text(subdiv[i] > 0 ? toGPAString(subgpa) : '');
        $('#subtotal' + i).text(subtotal[i] || '');
        total += subtotal[i];
        div += subdiv[i];
        weight += subweight[i];
        if (subdiv[i] > 0) {
            points.push([ (i % 2 ? '계절' : i + 2 >> 1) + '학기',
                          subgpa.toFixed(2) - 0]);
        }
    }

    $('#gpa').text(div > 0 ? toGPAString(weight / (div * 10)) : '0.00');
    $('#total').text(total);

  google.visualization.drawChart({
    chartType: 'BarChart',
    containerId: 'timeline',
    dataTable: google.visualization.arrayToDataTable([
      [ '학기', '평점' ]
    ].concat(points)),
    options: {
      height: 300,
      chartArea: { left: '20%', top: '5%', width: '75%', height: '90%' },
      backgroundColor: 'none',
      colors: [ '#3a6e74' ],
      fontSize: 11,
      fontName: 'inherit',
      legend: 'none'
    }
  });

  google.visualization.drawChart({
    chartType: 'PieChart',
    containerId: 'histogram',
    dataTable: google.visualization.arrayToDataTable([
      [ '학점', '개수' ]
    ].concat($.map(count, function (v, k) { return [[ LC[k], v ]]; }).reverse())),
    options: {
      height: 228,
      chartArea: { left: '5%', top: '5%', width: '90%', height: '90%' },
      backgroundColor: 'none',
      colors: '#f02930,#f55022,#fa7714,#ff9d06,#c28810,#85731b,#495e25,#474930,#44343a,#422045,#2c152e,#160b17,#000'.split(','),
      fontSize: 11,
      fontName: 'inherit',
      pieHole: .4,
      pieSliceText: 'label',
      legend: 'none'
    }
  });
}

$grades.find('input,select').change(function () {
  calc();
  clearTimeout(timer);
  timer = setTimeout(function () { $grades.submit() }, 500);
});

google.setOnLoadCallback(calc);
