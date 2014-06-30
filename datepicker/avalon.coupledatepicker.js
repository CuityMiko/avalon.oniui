define(["avalon.getModel","text!./avalon.coupledatepicker.html", "datepicker/avalon.datepicker"], function(avalon, sourceHTML) {
    var arr = sourceHTML.split("MS_OPTION_STYLE") || ["", ""],  
        calendarTemplate = arr[0],
        cssText = arr[1].replace(/<\/?style>/g, ""), // 组件的css
        styleEl = document.getElementById("avalonStyle");
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }
    var widget = avalon.ui.coupledatepicker = function(element, data, vmodels) {
        var options = data.coupledatepickerOptions,
            inputFrom,
            inputTo,
            disabled = options.disabled.toString(),
            disabledVM = avalon.getModel(disabled, vmodels),
            duplex = options.duplex && options.duplex.split(","),
            rules = options.rules,
            _inputToValue = "",
            _toMinDate = "",
            _toMaxDate = "";
        var _c = {  
            '+M': function(time ,n) {
                var _d = time.getDate();
                time.setMonth(time.getMonth() + n);
                if(time.getDate() !== _d) {
                    time.setDate(0);
                } 
            },
            '-M': function(time ,n) { 
                var _d = time.getDate();
                time.setMonth(time.getMonth() - n);
                if(time.getDate() !== _d) {
                    time.setDate(0);
                }
            },
            '+D': function(time ,n) { 
                time.setDate(time.getDate() + n); 
            },
            '-D': function(time ,n) { 
                time.setDate(time.getDate() - n); 
            },
            '+Y': function(time ,n) { 
                time.setFullYear(time.getFullYear() + n); 
            },
            '-Y': function(time ,n) { 
                time.setFullYear(time.getFullYear() - n); 
            }
        };
        options.template = options.getTemplate(calendarTemplate, options);
        if(options.opts && options.opts.datesDisplayFormat && typeof options.opts.datesDisplayFormat ==="function") {
            options.datesDisplayFormat = options.opts.datesDisplayFormat;
        }
        if(rules && avalon.type(rules) === 'string') {
            var ruleVM = avalon.getModel(options.rules, vmodels);
            rules = ruleVM[1][ruleVM[0]];
            
        }
        rules = rules.$model || rules;
        _toMinDate = rules.toMinDate; 
        _toMaxDate = rules.toMaxDate; 
        if(rules) {
            rules.toMinDate = rules.toMinDate && "";
            rules.toMaxDate = rules.toMaxDate && "";
            rules.fromMaxDate = rules.fromMaxDate && "";
            rules.fromMaxDate = rules.fromMaxDate && "";
        }

        options.rules = rules;
        // if(selectFuncVM) {
        //     options.select = selectFuncVM[1][selectFuncVM[0]];
        // }
        if(disabled!=="true" && disabled!=="false" && disabledVM) {
            options.disabled = disabledVM[1][disabledVM[0]];
            disabledVM[1].$watch(disabledVM[0], function(val) {
                vmodel.disabled = val;
            });
        }
        var rangeRules = options.rules && options.rules.rules || "";
        rangeRules = rangeRules.length>0 ? rangeRules.split(",") : [];
        var container = options.container;
        if(typeof container==="string") {
            container = container.split(",")
            avalon.each(container, function(item, index) {
                container[0] = document.getElementById(container[0]);
                container[1] = document.getElementById(container[1]);
            });
        }
        if(!container.length) {
            container = element.getElementsByTagName("div");
        }
        options.container = container= container.length ? [].slice.call(container) : container;
        var vmodel = avalon.define(data.coupledatepickerId, function(vm) {
            avalon.mix(vm, options);
            vm.msg = "";
            vm.$skipArray = ["widgetElement","container","inputElement","calendarWrapper"];
            vm.widgetElement = element;
            vm.fromDisabled = options.disabled;
            vm.toDisabled = options.disabled;
            vm.inputElement = null;
            vm.inputFromValue = "";
            vm.inputToValue = "";
            vm.setDisabled = function(val) {
                vmodel.disabled = val;
            };
            vm.fromSelectCal = function(date) {
                applyRules(date);
            };
            vm.$init = function() {
                var template = options.template.replace(/MS_OPTION_FROM_LABEL/g,vmodel.fromCalendarLabel ).replace(/MS_OPTION_TO_LABEL/g,vmodel.toCalendarLabel ).split("MS_OPTION_TEMPLATE"),
                    containerTemp = template[0],
                    inputOnlyTemp = template[1],
                    calendar = null,
                    inputOnly = null,
                    fromInput = null,
                    toInput = null,
                    calendarTemplate = "";
                initValues();
                applyRules(vmodel.inputFromValue && options.parseDate(vmodel.inputFromValue) || new Date());
                calendarTemplate = vmodel.container.length ? inputOnlyTemp : containerTemp;
                calendarTemplate = calendarTemplate.replace("MS_OPTION_FROM_MINDATE", vmodel.rules.fromMinDate).replace("MS_OPTION_FROM_MAXDATE", vmodel.rules.fromMaxDate).replace("MS_OPTION_TO_MINDATE", vmodel.rules.toMinDate).replace("MS_OPTION_TO_MAXDATE", vmodel.rules.toMaxDate);
                if(vmodel.container.length) {
                    inputOnly = avalon.parseHTML(inputOnlyTemp);
                    fromInput = inputOnly.firstChild;
                    toInput = inputOnly.lastChild;
                    vmodel.containerFrom = vmodel.container[0];
                    vmodel.containerTo = vmodel.container[1];
                    vmodel.container[0].appendChild(fromInput);
                    vmodel.container[1].appendChild(toInput);
                } else {
                    calendar = avalon.parseHTML(calendarTemplate);
                    element.appendChild(calendar);
                }
                avalon.scan(element, [vmodel].concat(vmodels));
            };
            vm.$remove = function() {
                element.innerHTML = element.textContent = "";
            };
        })
        vmodel.$watch("disabled", function(val) {
            vmodel.fromDisabled = vmodel.toDisabled = val;
        })
        function initValues() {
            if(duplex) {
                var duplexLen = duplex.length,
                    duplexVM1 = avalon.getModel(duplex[0].trim(), vmodels),
                    duplexVM2 = duplexLen === 1 ? null : avalon.getModel(duplex[1].trim(), vmodels),
                    duplexVal1 = duplexVM1[1][duplexVM1[0]],
                    duplexVal2 = duplexVM2 ? duplexVM2[1][duplexVM2[0]] : "";
                setValues(duplexLen, duplexVal1, duplexVal2);
            } 
        }
        function setValues(len, from, to) {
            if(len) {
                if(len==2) {
                    vmodel.inputFromValue = from && options.parseDate(from) && from || "";
                    _inputToValue = to;
                    vmodel.inputToValue = to && options.parseDate(to) && to || "";
                } else if(len==1){
                    vmodel.inputFromValue = from && options.parseDate(from) && from || "";
                }
            }
        }
        function applyRules(date) {
            var df = {},
                rules = vmodel.rules;
            for(var i = 0 , type = ['defaultDate', 'minDate', 'maxDate'] ; i < type.length ; i++){
                if (rangeRules[i]) {
                    df[type[i]] = calcDate(rangeRules[i], date);
                }
            }
            var minDate = _toMinDate && options.parseDate(_toMinDate), 
                maxDate = _toMaxDate && options.parseDate(_toMaxDate),
                minDateRule = df['minDate'],
                maxDateRule = df['maxDate'];
            minDate = (minDateRule ? minDateRule.getTime() : -1) > (minDate ? minDate.getTime() : -1) ? minDateRule : minDate ;
            maxDate = (maxDateRule ? maxDateRule.getTime() : Number.MAX_VALUE) > (maxDate ? maxDate.getTime() : Number.MAX_VALUE) ? maxDate : maxDateRule;
            if (minDate){
                var toMinDateFormat = options.formatDate(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                if(_inputToValue) {
                    vmodel.rules.toMinDate = toMinDateFormat;
                    if(!vmodel.inputToValue) {
                        vmodel.inputToValue = toMinDateFormat;
                    }
                }
            }
            if (maxDate) {
                vmodel.rules.toMaxDate = options.formatDate(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
            }
        }
        function calcDate( desc , date ){
            var time;
            desc = ( desc || "" ).toString();
            time = date ? date : new Date();
            var _date = new Date(time);
            var re = /([+-])?(\d+)([MDY])?/g , 
                arr = re.exec(desc),
                key = arr && ((arr[1] || '+') + (arr[3] || 'D'));
            if(key && _c[key]){
                _c[key](_date ,arr[2] * 1);
            }
            return _date;
        }
        function cleanDate( date ){
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        }
        return vmodel;
    }
    widget.version = 1.0
    widget.defaults = {
        container : [], //必选，渲染的容器，每个元素类型为 {Element|JQuery|String}
        fromCalendarLabel : '选择起始日期',   // 起始日期日历框上方提示文字
        toCalendarLabel : '选择结束日期',     // 结束日期日历框上方提示文字
        fromName : 'fromDate',      // better exist 生成的起始日期input默认的name
        toName : 'toDate',          // better exist 生成的结束日期input默认的name
        defaultValue : [ '2013-11-15' , '2013-11-16' ], //初始化日期，参见setDates方法
        widgetElement: "", // accordion容器
        disabled: "",
        startDay: 1,    //星期开始时间
        separator: "-",
        rules: "",
        parseDate : function( str ){
            var separator = this.separator;
            var reg = "^(\\d{4})" + separator+ "(\\d{1,2})"+ separator+"(\\d{1,2})$";
            reg = new RegExp(reg);
            var x = str.match(reg);
            return x ? new Date(x[1],x[2] * 1 -1 , x[3]) : null;
        },
        formatDate : function( year, month, day ){
            var separator = this.separator;
            return year + separator + formatNum( month + 1 , 2 ) + separator + formatNum( day , 2 );
        },
        datesDisplayFormat: function(label, fromDate, toDate) {
            return label + "：" + fromDate + ' 至 ' + toDate;
        },
        getTemplate: function(str, options) {
            return str;
        }
    }
    function formatNum ( n , length ){
        n = String(n);
        for( var i = 0 , len = length - n.length ; i < len ; i++)
            n = "0" + n;
        return n;
    }
    return avalon;
})