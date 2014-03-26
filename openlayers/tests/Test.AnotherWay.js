/**
 *  Test.AnotherWay version 0.5
 *  
 *  Copyright (c) 2005 Artem Khodush, http://straytree.org
 *  
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 *  
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *  
 */

if (typeof(Test) == "undefined") {
    Test = {};
}
Test.AnotherWay = {};

Test.AnotherWay._g_test_iframe = null; // frame where to load test pages
Test.AnotherWay._g_test_frame_no_clear = false; // true - leave last page displayed after tests end
Test.AnotherWay._g_test_page_urls = []; // array of: { url: url, convention: "anotherway" or "jsan" }
Test.AnotherWay._g_test_object_for_jsan = null; // test object for filling by tests that adhere to jsan Test.Simple calling convention
Test.AnotherWay._g_pages_to_run = null; // list of pages to run automatically after loading
Test.AnotherWay._g_run_on_main_load = false; // special handling for run_pages_to_run when it might be called before onload or before list of test pages is known.
Test.AnotherWay._g_run_on_list_load = false;
Test.AnotherWay._g_main_loaded = false;

Test.AnotherWay._run_pages_to_run = function(called_from_outside){
    if (!Test.AnotherWay._g_main_loaded) {
        Test.AnotherWay._g_run_on_main_load = true;
    }
    else {
        var a_pages = Test.AnotherWay._g_pages_to_run;
        if (a_pages == "all") {
            for (var i = 0; i < Test.AnotherWay._g_test_page_urls.length; ++i) {
                Test.AnotherWay._run_test_page("test" + i);
            }
        }
        else 
            if (a_pages != null) {
                for (var run_i = 0; run_i < a_pages.length; ++run_i) {
                    var run_page = a_pages[run_i];
                    var found = false;
                    for (var all_i = 0; all_i < Test.AnotherWay._g_test_page_urls.length; ++all_i) {
                        if (run_page == Test.AnotherWay._g_test_page_urls[all_i].url) {
                            Test.AnotherWay._run_test_page("test" + all_i, called_from_outside);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        Test.AnotherWay._show_error("page specified to run is not found in the page list: " + run_page);
                        break;
                    }
                }
            }
    }
};

Test.AnotherWay._add_test_page_url = function(test_url, convention){
    var table = document.getElementById("testtable");
    var record_select = document.getElementById("record_select");
    var index = Test.AnotherWay._g_test_page_urls.length;
    
    // trim spaces.
    if (test_url.match("^(\\s*)(.*\\S)(\\s*)$")) {
        test_url = RegExp.$2;
    }
    
    Test.AnotherWay._g_test_page_urls[index] = {
        url: test_url,
        convention: convention
    };
    var row = table.insertRow(-1);
    
    var cell;
    var cell_child;
    var link;
    
    cell = row.insertCell(-1);
    cell_child = document.createElement("input");
    cell_child.type = "checkbox";
    cell_child.id = "checkbox" + index;
    cell_child.checked = 'checked';
    cell_child.defaultChecked = 'checked';
    cell.appendChild(cell_child);
    
    cell = row.insertCell(-1);
    cell.setAttribute("width", "75%");
    
    cell.appendChild(document.createTextNode(test_url));    
    
    cell = row.insertCell(-1);
    cell_child = document.createElement("input");
    cell_child.type = "button";
    cell_child.id = "test" + index;
    cell_child.value = " run ";
    cell_child.onclick = Test.AnotherWay._run_one_onclick;
    cell.appendChild(cell_child);
    
    cell = row.insertCell(-1);
    cell.setAttribute("width", "8em");
    cell_child = document.createElement("span");
    cell.appendChild(cell_child);
    
    var option = document.createElement("option");
    option.appendChild(document.createTextNode(test_url));
    record_select.appendChild(option);
};
Test.AnotherWay._show_error = function(msg){
    var error_div = document.getElementById("error");
    error_div.innerHTML = "";
    error_div.appendChild(document.createTextNode(msg));
    error_div.style.display = "block";
};

// read urls from the list in the html file inside the list_iframe
// fill on-screen list with urls and "run" buttons, and fill the g_test_page_urls object.
Test.AnotherWay._list_iframe_onload = function(){
    if (window.frames.list_iframe != null && window.frames.list_iframe.location != "" && window.frames.list_iframe.location != "about:blank") {
        var list_doc = window.frames.list_iframe.document;
        var list = list_doc.getElementById("testlist");
        if (list != null) {
            for (var i = 0; i < list.childNodes.length; ++i) {
                var item = list.childNodes[i];
                if (item.nodeName == "LI" || item.nodeName == "li") {
                    var convention = "anotherway";
                    if (Test.AnotherWay._get_css_class(item) == "jsan") {
                        convention = "jsan";
                    }
                    Test.AnotherWay._add_test_page_url(item.innerHTML, convention);
                }
            }
            if (Test.AnotherWay._g_run_on_list_load) {
                Test.AnotherWay._g_run_on_list_load = false;
                Test.AnotherWay._run_pages_to_run();
            }
        }
        else {
            Test.AnotherWay._show_error("no list with id 'testlist' in a list file " + window.frames.list_iframe.location);
        }
    }
};

Test.AnotherWay._map_checkboxes = function(f){
    var table = document.getElementById("testtable");
    var checks = table.getElementsByTagName("INPUT");
    for (var i = 0; i < checks.length; ++i) {
        if (checks[i].type == "checkbox" && checks[i].id.match(/^checkbox(\d+)$/)) {
            f(checks[i], RegExp.$1);
        }
    }
};

Test.AnotherWay._run_all_onclick = function(){
    Test.AnotherWay._map_checkboxes(function(c, id){
        Test.AnotherWay._run_test_page("test" + id);
    });
};
Test.AnotherWay._run_selected_onclick = function(){
    Test.AnotherWay._map_checkboxes(function(c, id){
        if (c.checked) {
            Test.AnotherWay._run_test_page("test" + id);
        }
    });
};

Test.AnotherWay._unselect_all_onclick = function(){
    Test.AnotherWay._map_checkboxes(function(c, id){
        c.checked = false;
    });
};

Test.AnotherWay._run_one_onclick = function(){
    Test.AnotherWay._run_test_page(this.id);
};

// construct an object that will gather results of running one test function
Test.AnotherWay._test_object_t = function(fun_name){
    this.name = fun_name; // name of the test function
    this.n_plan = null; // planned number of assertions
    this.n_ok = 0; // # of ok assertions
    this.n_fail = 0; // # of failed assertions
    this.exception = ""; // if the function throwed an exception, it's its message
    this.exception_stack = []; // strings: function call stack from the exception
    this.assertions = []; // assertion results: array of { ok: 1 or 0, name: string }
    this.wait_result_milliseconds = 0; // how long to wait before collecting results from the test
    this.second_wait_msg = null; // <p> status message (in addition to the page wait_msg)
    this.delay_actions = []; // array of actions to be perfomed after the test function returns
    //  action : { acton_kind: "call" | "window" | "replay"
    //              when "call":        { call_fn call_delay_milliseconds } call_fn takes nothing
    //              when "window" :     { wnd_url wnd_wnd wnd_fn wnd_timeout_milliseconds wnd_dont_close } wnd_fn takes wnd
    //              wnen "replay" :     { replay_wnd replay_events replay_event_i replay_checkpoints } checkpoint_fn takes this, wnd
    //  }
    this.delay_action_i = null; // index of delay action currently being performed
    this.delay_prev_timer_time = 0; // for counting time while performing delay_actions
    this.delay_current_milliseconds_left = 0; // time left before the next action, runs down
    this.delay_total_milliseconds_left = 0; // for indication: total estimated time for all actions, runs up and down
};

Test.AnotherWay._test_object_t.prototype.ok = function(cond, name){
    if (cond) {
        ++this.n_ok;
        cond = 1;
    }
    else {
        ++this.n_fail;
        cond = 0;
    }
    this.assertions.push({
        ok: cond,
        name: name
    });
};
Test.AnotherWay._test_object_t.prototype.fail = function(name){
    this.ok(false, name);
};
Test.AnotherWay._test_object_t.prototype.plan = function(n){
    this.n_plan = n;
};
Test.AnotherWay._test_object_t.prototype.wait_result = function(seconds){
    this.wait_result_milliseconds = 1000 * seconds;
};
Test.AnotherWay._eq_fail_msg = function(path, what, expected, got){
    return "eq: " + path + " " + what + " differ: got " + got + ", but expected " + expected;
};
Test.AnotherWay._array_eq = function(expected, got, path, msg){
    if (expected.length != got.length) {
        msg.msg = Test.AnotherWay._eq_fail_msg(path, "array length", expected.length, got.length);
        return false;
    }
    for (var i = 0; i < expected.length; ++i) {
        if (!Test.AnotherWay._thing_eq(expected[i], got[i], path + "[" + i + "]", msg)) {
            return false;
        }
    }
    return true;
};
Test.AnotherWay._object_eq = function(expected, got, path, msg){
    var v;
    for (v in expected) {
        if (!(v in got)) {
            msg.msg = Test.AnotherWay._eq_fail_msg(path + "." + v, "properties", expected[v], "undefined");
            return false;
        }
        if (!Test.AnotherWay._thing_eq(expected[v], got[v], path + "." + v, msg)) {
            return false;
        }
    }
    for (v in got) {
        if (!(v in expected)) {
            msg.msg = Test.AnotherWay._eq_fail_msg(path + "." + v, "properties", "undefined", got[v]);
            return false;
        }
    }
    return true;
};

Test.AnotherWay._constructor_name = function(x){
    if (x == null) {
        return "";
    }
    var s = "unknown";
    try {
        s = typeof(x.constructor);
        if (s != "unknown") {
            s = x.constructor.toString();
        }
    } 
    catch (e) {
        s = "unknown";
    }
    if (s == "unknown") {
        // hackish attempt to guess a type
        var is_array = true;
        var index = 0;
        for (i in x) {
            if (i != index) {
                is_array = false;
            }
            ++index;
        }
        return is_array ? "Array" : "Object"; // for empty arrays/objects, this will be wrong half the time
    }
    else 
        if (s.match(/^\s*function\s+(\w+)\s*\(/)) {
            return RegExp.$1;
        }
        else {
            var c = '';
            switch (typeof x) {
                case 'string':
                    c = 'String';
                    break;
                case 'object':
                    c = 'Object';
                    break;
                default:
                    c = '';
            }
            return c;
        }
};
Test.AnotherWay._is_array = function(x){
    return Test.AnotherWay._constructor_name(x) == "Array";
};

Test.AnotherWay._is_value_type = function(x){
    cn = Test.AnotherWay._constructor_name(x);
    return cn == "Number" || cn == "String" || cn == "Boolean" || cn == "Date";
};

Test.AnotherWay._thing_eq = function(expected, got, path, msg){
    if (expected == null && got == null) {
        return true;
    }
    else 
        if ((expected == null && got != null) || (expected != null && got == null)) {
            msg.msg = Test.AnotherWay._eq_fail_msg(path, "values", expected, got);
            return false;
        }
        else {
            var expected_cn = Test.AnotherWay._constructor_name(expected);
            var got_cn = Test.AnotherWay._constructor_name(got);
            if (expected_cn != got_cn) {
                msg.msg = Test.AnotherWay._eq_fail_msg(path, "types", expected_cn, got_cn);
                return false;
            }
            else {
                if (Test.AnotherWay._is_array(expected)) {
                    return Test.AnotherWay._array_eq(expected, got, path, msg);
                }
                else 
                    if (Test.AnotherWay._is_value_type(expected)) {
                        if (expected != got) {
                            msg.msg = Test.AnotherWay._eq_fail_msg(path, "values", expected, got);
                            return false;
                        }
                        else {
                            return true;
                        }
                    }
                    else { // just a plain object
                        return Test.AnotherWay._object_eq(expected, got, path, msg);
                    }
            }
        }
};

Test.AnotherWay._test_object_t.prototype.eq = function(got, expected, name){
    var msg = {};
    if (Test.AnotherWay._thing_eq(expected, got, "", msg)) {
        this.ok(1, name);
    }
    else {
        this.fail(name + ". " + msg.msg);
    }
};

Test.AnotherWay._test_object_t.prototype.like = function(got, expected, name){
    if (got.match(expected) != null) {
        this.ok(1, name);
    }
    else {
        this.fail(name + ": got " + got + ", but expected it to match: " + expected);
    }
};

Test.AnotherWay._g_html_eq_span = null;
Test.AnotherWay._html_eq_string_to_node = function(string_or_node, what, msg){
    if (string_or_node.nodeType != null) {
        string_or_node = Test.AnotherWay._html_eq_node_to_string(string_or_node); // double trip - to make properties assigned in scripts available as html node attributes
    }
    if (Test.AnotherWay._g_html_eq_span == null) {
        Test.AnotherWay._g_html_eq_span = document.createElement("span");
    }
    Test.AnotherWay._g_html_eq_span.innerHTML = string_or_node;
    if (Test.AnotherWay._g_html_eq_span.childNodes.length != 1) {
        msg.msg = "bad " + what + " html string given (should contain exactly one outermost element): " + string_or_node;
    }
    return Test.AnotherWay._g_html_eq_span.childNodes[0].cloneNode(true);
};

Test.AnotherWay._html_eq_node_to_string = function(node){
    if (Test.AnotherWay._g_html_eq_span == null) {
        Test.AnotherWay._g_html_eq_span = document.createElement("span");
    }
    Test.AnotherWay._g_html_eq_span.innerHTML = "";
    if (node.outerHTML != null) {
        Test.AnotherWay._g_html_eq_span.innerHTML = node.outerHTML;
    }
    else {
        var clone = node.cloneNode(true);
        var node = Test.AnotherWay._g_html_eq_span;
        if (node.ownerDocument && node.ownerDocument.importNode) {
            if (node.ownerDocument != clone.ownerDocument) {
                clone = node.ownerDocument.importNode(clone, true);
            }
        }
        node.appendChild(clone);
    }
    return Test.AnotherWay._g_html_eq_span.innerHTML;
};

Test.AnotherWay._html_eq_path_msg = function(path){
    var msg = "";
    for (var i = 0; i < path.length; ++i) {
        msg += " [node " + path[i].node;
        if (path[i].id != null && path[i].id != "") {
            msg += " id " + path[i].id;
        }
        else 
            if (path[i].index != null) {
                msg += " at index " + path[i].index;
            }
        msg += "] ";
    }
    return msg;
};

Test.AnotherWay._html_eq_fail_msg = function(path, what, expected, got){
    return Test.AnotherWay._html_eq_path_msg(path) + ": " + what + " differ: got " + got + ", but expected " + expected;
};

Test.AnotherWay._html_eq_remove_blank = function(text){
    if (text == null) {
        return "";
    }
    else 
        if (text.match("^(\\s*)(.*\\S)(\\s*)$")) {
            return RegExp.$2;
        }
        else 
            if (text.match("\s*")) {
                return "";
            }
    return text;
};

Test.AnotherWay._html_eq_remove_blank_nodes = function(node){
    var to_remove = [];
    for (var child = node.firstChild; child != null; child = child.nextSibling) {
        if (child.nodeType == 3) {
            var value = Test.AnotherWay._html_eq_remove_blank(child.nodeValue);
            if (value == "") {
                to_remove.push(child);
            }
            else {
                child.nodeValue = value;
            }
        }
    }
    for (var i = 0; i < to_remove.length; ++i) {
        node.removeChild(to_remove[i]);
    }
};

Test.AnotherWay._html_node_type_text = function(node_type){
    if (node_type == 1) {
        return "1 (html element)";
    }
    else 
        if (node_type == 3) {
            return "3 (text)";
        }
        else {
            return node_type;
        }
};

Test.AnotherWay._html_eq_node = function(expected, got, path, msg, expected_loc_base, got_loc_base){
    if (expected.nodeType != got.nodeType) {
        msg.msg = Test.AnotherWay._html_eq_fail_msg(path, "node types", Test.AnotherWay._html_node_type_text(expected.nodeType), Test.AnotherWay._html_node_type_text(got.nodeType));
        return false;
    }
    else 
        if (expected.nodeType == 3) {
            if (expected.nodeValue != got.nodeValue) {
                msg.msg = Test.AnotherWay._html_eq_fail_msg(path, "text", expected.nodeValue, got.nodeValue);
                return false;
            }
        }
        else 
            if (expected.nodeType == 1) {
                if (expected.nodeName != got.nodeName) {
                    msg.msg = Test.AnotherWay._html_eq_fail_msg(path, "node names", expected.nodeName, got.nodeName);
                    return false;
                }
                // compare attributes
                var expected_attrs = {};
                var got_attrs = {};
                var i;
                var a;
                for (i = 0; i < expected.attributes.length; ++i) {
                    a = expected.attributes[i];
                    if (a.specified) {
                        expected_attrs[a.name] = 1;
                    }
                }
                for (i = 0; i < got.attributes.length; ++i) {
                    a = got.attributes[i];
                    if (a.specified) {
                        got_attrs[a.name] = 1;
                    }
                }
                for (a in expected_attrs) {
                    if (!(a in got_attrs)) {
                        msg.msg = Test.AnotherWay._html_eq_path_msg(path) + ": attribute sets differ: expected attribute " + a + " is missing";
                        return false;
                    }
                }
                for (a in got_attrs) {
                    if (!(a in expected_attrs)) {
                        msg.msg = Test.AnotherWay._html_eq_path_msg(path) + ": attribute sets differ: got extra attribute " + a;
                        return false;
                    }
                }
                for (a in expected_attrs) {
                    var expected_value = expected.getAttribute(a);
                    var got_value = got.getAttribute(a);
                    if (typeof(expected_value) == "string" && typeof(got_value) == "string") {
                        expected_value = Test.AnotherWay._html_eq_remove_blank(expected_value);
                        got_value = Test.AnotherWay._html_eq_remove_blank(got_value);
                        var ok = expected_value == got_value;
                        if (!ok && (a == "href" || a == "HREF")) { // try relative hrefs
                            var expected_relative_value = expected_value;
                            if (expected_loc_base != null && expected_value.substring(0, expected_loc_base.length) == expected_loc_base) {
                                expected_relative_value = expected_value.substring(expected_loc_base.length);
                            }
                            var got_relative_value = got_value;
                            if (got_loc_base != null && got_value.substring(0, got_loc_base.length) == got_loc_base) {
                                got_relative_value = got_value.substring(got_loc_base.length);
                            }
                            ok = expected_relative_value == got_relative_value;
                        }
                        if (!ok) {
                            msg.msg = Test.AnotherWay._html_eq_fail_msg(path, "attribute " + a + " values", expected_value, got_value);
                            return false;
                        }
                    }
                    else 
                        if (typeof(expected_value) == "function" && typeof(got_value) == "function") {
                            expected_value = expected_value.toString();
                            got_value = got_value.toString();
                            if (expected_value != got_value) {
                                msg.msg = Test.AnotherWay._html_eq_fail_msg(path, "attribute " + a + " values", expected_value, got_value);
                                return false;
                            }
                        }
                        else {
                            var value_msg = {};
                            if (!Test.AnotherWay._thing_eq(expected_value, got_value, "", value_msg)) {
                                msg.msg = Test.AnotherWay._html_eq_path_msg(path) + ": attribute " + a + " values differ: " + value_msg.msg;
                                return false;
                            }
                        }
                }
                // compare child nodes
                Test.AnotherWay._html_eq_remove_blank_nodes(expected);
                Test.AnotherWay._html_eq_remove_blank_nodes(got);
                var expected_length = expected.childNodes.length;
                var got_length = got.childNodes.length;
                if (expected_length < got_length) {
                    msg.msg = Test.AnotherWay._html_eq_path_msg(path) + ": got " + (got_length - expected_length) + " extra child nodes";
                    return false;
                }
                else 
                    if (expected_length > got_length) {
                        msg.msg = Test.AnotherWay._html_eq_path_msg(path) + ": expected " + (expected_length - got_length) + " more child nodes";
                        return false;
                    }
                    else {
                        for (i = 0; i < expected_length; ++i) {
                            var expected_node = expected.childNodes[i];
                            path.push({
                                node: expected_node.nodeName,
                                id: expected_node.id,
                                index: i
                            });
                            var eq = Test.AnotherWay._html_eq_node(expected_node, got.childNodes[i], path, msg, expected_loc_base, got_loc_base);
                            path.pop();
                            if (!eq) {
                                return false;
                            }
                        }
                    }
            }
    return true;
};

Test.AnotherWay._html_eq_get_loc_base = function(node){
    var loc_base = document.location;
    if (node.ownerDocument != null) {
        loc_base = node.ownerDocument.location;
    }
    if (loc_base != null) {
        loc_base = loc_base.href;
        var slash_pos = loc_base.lastIndexOf("/");
        if (slash_pos != -1) {
            loc_base = loc_base.substring(0, slash_pos + 1);
        }
    }
    return loc_base;
};

Test.AnotherWay._test_object_t.prototype.html_eq = function(got, expected, name){
    var msg = {};
    var expected_node = Test.AnotherWay._html_eq_string_to_node(expected, "expected", msg);
    if (msg.msg != null) {
        this.fail(name + " html_eq: " + msg.msg);
    }
    else {
        var got_node = Test.AnotherWay._html_eq_string_to_node(got, "got", msg);
        if (msg.msg != null) {
            this.fail(name + " html_eq: " + msg.msg);
        }
        else {
            var expected_loc_base = Test.AnotherWay._html_eq_get_loc_base(expected);
            var got_loc_base = Test.AnotherWay._html_eq_get_loc_base(got);
            if (Test.AnotherWay._html_eq_node(expected_node, got_node, [], msg, expected_loc_base, got_loc_base)) {
                this.ok(1, name);
            }
            else {
                var msg = name + " html_eq " + msg.msg;
                var expected_str = Test.AnotherWay._html_eq_node_to_string(expected_node);
                var got_str = Test.AnotherWay._html_eq_node_to_string(got_node);
                msg += ".\n got html: " + got_str;
                msg += ".\n expected html: " + expected_str;
                this.fail(msg);
            }
        }
    }
};

Test.AnotherWay._debug_pane_print = function(msg){
    var d = new Date();
    var p = document.createElement("p");
    p.appendChild(document.createTextNode(d.toLocaleTimeString() + " " + msg));
    var debug_pane = document.getElementById("debug");
    debug_pane.appendChild(p);
    var debug_tab = document.getElementById("debug_tab");
    var results_tab = document.getElementById("results_tab");
    debug_tab.style.visibility = "visible";
    results_tab.style.visibility = "visible";
};

Test.AnotherWay._test_object_t.prototype.debug_print = function(msg){
    Test.AnotherWay._debug_pane_print(this.name + ": " + msg);
};

Test.AnotherWay._test_object_t.prototype.delay_call = function(){
    var timeout_ms = 200;
    for (var i = 0; i < arguments.length; ++i) {
        if (typeof(arguments[i]) != "function") {
            timeout_ms = 1000 * arguments[i];
        }
        else {
            var action = {
                action_kind: "call",
                call_delay_milliseconds: timeout_ms,
                call_fn: arguments[i]
            };
            this.delay_total_milliseconds_left += Test.AnotherWay._action_estimate_milliseconds(action);
            this.delay_actions.push(action);
        }
    }
};

Test.AnotherWay._test_object_t.prototype.open_window = function(url, fn, timeout_seconds){
    if (timeout_seconds == null) {
        timeout_seconds = 4;
    }
    var no_close = document.getElementById("dont_close_test_windows");
    var action = {
        action_kind: "window",
        wnd_url: url.toString() + (window.location.search || ""),
        wnd_wnd: null,
        wnd_fn: fn,
        wnd_timeout_milliseconds: timeout_seconds * 1000,
        wnd_no_close: no_close.checked
    };
    this.delay_total_milliseconds_left += Test.AnotherWay._action_estimate_milliseconds(action);
    this.delay_actions.push(action);
};

Test.AnotherWay._test_object_t.prototype.replay_events = function(wnd, events){
    if (Test.AnotherWay._g_no_record_msg != null) {
        this.fail("replay_events: " + Test.AnotherWay._g_no_record_msg);
    }
    else {
        var action = {
            action_kind: "replay",
            replay_wnd: wnd,
            replay_events: events.events,
            replay_event_i: null,
            replay_checkpoints: events.checkpoints
        };
        this.delay_total_milliseconds_left += Test.AnotherWay._action_estimate_milliseconds(action);
        this.delay_actions.push(action);
    }
};

Test.AnotherWay._action_estimate_milliseconds = function(action){
    var ms = 0;
    if (action.action_kind == "call") {
        ms = action.call_delay_milliseconds;
    }
    else 
        if (action.action_kind == "window") {
            ms = 0;
        }
        else 
            if (action.action_kind == "replay") {
                ms = 0;
                for (var i = 0; i < action.replay_events.length; ++i) {
                    ms += action.replay_events[i]["time"] - 0;
                }
            }
    return ms;
};

Test.AnotherWay._g_timeout_granularity = 200;
Test.AnotherWay._g_tests_queue = []; // vector of { url: string, test_objects : array of test_object_t, test_object_i: int, wait_msg: <p> object, loading_timeout_milliseconds: int, timeout_id: id }
// load one html page, schedule further processing
Test.AnotherWay._run_test_page = function(id, called_from_outside){
    if (id.match(/^test(\d+)/)) {
        id = RegExp.$1;
        Test.AnotherWay._g_tests_queue.push({
            url: Test.AnotherWay._g_test_page_urls[id].url,
            convention: Test.AnotherWay._g_test_page_urls[id].convention,
            test_objects: []
        });
        if (Test.AnotherWay._g_tests_queue.length == 1) {
            if (!called_from_outside) {
                // Crap. Be careful stepping around.
                // For Mozilla and Opera, when this file is included into the frameset page that is in another directory (and _g_outside_path_correction!=null)
                // but the test pages are started from within it (by "run" buttons), then:
                // depending on whether the page is the first one loaded into the test frame or not,
                // the base url for relative test pages differs.
                // Crap, like I said.
                Test.AnotherWay._g_tests_queue[0].suppress_outside_path_correction = true;
            }
            Test.AnotherWay._start_loading_page();
        }
    }
};

Test.AnotherWay._load_next_page = function(){
    Test.AnotherWay._g_tests_queue.splice(0, 1);
    if (Test.AnotherWay._g_tests_queue.length > 0) {
        Test.AnotherWay._start_loading_page();
    }
    else {
        if (!Test.AnotherWay._g_test_frame_no_clear) {
            Test.AnotherWay._g_test_iframe.location.replace("about:blank");
        }
    }
};

Test.AnotherWay._g_opera_path_correction = null; // ugly wart to support opera
Test.AnotherWay._g_outside_path_correction = null; // ugly wart to accomodate Opera and Mozilla, where relative url relates to the directory where the page that calls this function is located
Test.AnotherWay._set_iframe_location = function(iframe, loc, outside_path_correction){
    // allow to load only locations with the same origin
    var proto_end = loc.indexOf("://");
    if (proto_end != -1) { // otherwise, it's safe to assume (for Opera, Mozilla and IE ) that loc will be treated as relative
        var main_loc = window.location.href;
        var host_end = loc.substring(proto_end + 3).indexOf("/");
        var ok = false;
        if (host_end != -1) {
            var loc_origin = loc.substring(0, proto_end + 3 + host_end + 1);
            if (main_loc.length >= loc_origin.length && main_loc.substring(0, loc_origin.length) == loc_origin) {
                ok = true;
            }
        }
        if (!ok) {
            return {
                msg: "test pages may have only urls with the same origin as " + main_loc
            };
        }
    }
    // opera cannot handle urls relative to file:// without assistance
    if (window.opera != null && window.location.protocol == "file:" && loc.indexOf(":") == -1) {
        var base = window.location.href;
        var q_pos = base.indexOf("?");
        if (q_pos != -1) {
            base = base.substring(0, q_pos);
        }
        var slash_pos = base.lastIndexOf("/");
        if (slash_pos != -1) {
            base = base.substring(0, slash_pos + 1);
            Test.AnotherWay._g_opera_path_correction = base;
            loc = base + loc;
        }
    }
    // if this function is called from another page, and if that page is in another directory, correction is needed
    if (outside_path_correction != null) {
        var pos = loc.indexOf(outside_path_correction);
        if (pos == 0) {
            loc = loc.substring(outside_path_correction.length + 1);
        }
    }
    if (iframe.location != null) {
        iframe.location.replace(loc);
    }
    else {
        iframe.src = loc;
    }
    return {};
};

Test.AnotherWay._start_loading_page = function(){
    var test_page = Test.AnotherWay._g_tests_queue[0];
    test_page.loading_timeout_milliseconds = 12000;
    test_page.timeout_id = setTimeout(Test.AnotherWay._loading_timeout, Test.AnotherWay._g_timeout_granularity);
    test_page.wait_msg = Test.AnotherWay._print_counter_result(test_page.url, "loading...", test_page.loading_timeout_milliseconds, "loading");
    if (test_page.convention == "jsan") {
        // the tests in that page will run when it's loading, so the test object must be ready
        Test.AnotherWay._g_test_object_for_jsan = new Test.AnotherWay._test_object_t(test_page.url);
    }
    var outside_path_correction = null;
    if (Test.AnotherWay._g_outside_path_correction != null && !test_page.suppress_outside_path_correction) {
        outside_path_correction = Test.AnotherWay._g_outside_path_correction;
    }
    var result = Test.AnotherWay._set_iframe_location(Test.AnotherWay._g_test_iframe, test_page.url, outside_path_correction);
    if (result.msg != null) {
        Test.AnotherWay._unprint_result(test_page.wait_msg);
        Test.AnotherWay._print_result(test_page.url, result.msg, "badtest", null);
        Test.AnotherWay._load_next_page();
    }
};

Test.AnotherWay._loading_timeout = function(){
    var test_page = Test.AnotherWay._g_tests_queue[0];
    test_page.loading_timeout_milliseconds -= Test.AnotherWay._g_timeout_granularity;
    if (test_page.loading_timeout_milliseconds > 0) {
        Test.AnotherWay._update_msg_counter(test_page.wait_msg, (test_page.loading_timeout_milliseconds / 1000).toFixed());
        test_page.timeout_id = setTimeout(Test.AnotherWay._loading_timeout, Test.AnotherWay._g_timeout_granularity);
    }
    else {
        Test.AnotherWay._unprint_result(test_page.wait_msg);
        Test.AnotherWay._print_result(test_page.url, "Unable to load test page. Timeout expired", "badtest", null);
        Test.AnotherWay._load_next_page();
    }
};

Test.AnotherWay._strip_query_and_hash = function(s){
    var i = s.lastIndexOf("#");
    if (i != -1) {
        s = s.substring(0, i);
    }
    i = s.lastIndexOf("?");
    if (i != -1) {
        s = s.substring(0, i);
    }
    return s;
};

Test.AnotherWay._is_url_loaded = function(url, wnd){
    var loaded = false;
    if (wnd != null && wnd.location != null) {
        // after some popup blocker interference, location may behave strange..
        var location_s = "";
        location_s += wnd.location;
        if (location_s != "") {
            var pathname = wnd.location.pathname;
            var expected_url = url;
            var i = expected_url.lastIndexOf("#");
            if (i != -1) {
                expected_url = expected_url.substring(0, i);
            }
            i = expected_url.lastIndexOf("?");
            if (i != -1) {
                expected_url = expected_url.substring(0, i);
            }
            i = expected_url.lastIndexOf("/");
            if (i != -1 && i != expected_url.length - 1) {
                expected_url = expected_url.substring(i + 1);
            }
            i = pathname.indexOf(expected_url);
            if (wnd.location.href == url || (i != -1 && i == pathname.length - expected_url.length)) {
                if ( /*window.opera==null*/wnd.document.readyState == null || wnd.document.readyState == "complete") { // for opera (and IE?), getElementById does not work until..
                    loaded = true;
                }
            }
        }
    }
    return loaded;
};
// find and run all test functions in the g_cur_page html page.
Test.AnotherWay._test_page_onload = function(){
    if (Test.AnotherWay._g_tests_queue.length == 0) {
        return;
    }
    var test_page = Test.AnotherWay._g_tests_queue[0];
    if (!Test.AnotherWay._is_url_loaded(test_page.url, Test.AnotherWay._g_test_iframe)) {
        return;
    }
    clearTimeout(test_page.timeout_id);
    Test.AnotherWay._unprint_result(test_page.wait_msg);
    
    if (test_page.convention == "anotherway") {
        // get test function names (those beginning with "test")
        if (typeof(Test.AnotherWay._g_test_iframe.document.scripts) != 'undefined') { // IE
            for (var i = 0; i < Test.AnotherWay._g_test_iframe.document.scripts.length; ++i) {
                var script_text = Test.AnotherWay._g_test_iframe.document.scripts[i].text;
                var fun_sig = "function test";
                var fun_start = script_text.indexOf(fun_sig);
                
                while (fun_start != -1) {
                    script_text = script_text.substring(fun_start, script_text.length);
                    var fun_end = script_text.indexOf('(');
                    var fun_name = script_text.substring("function ".length, fun_end);
                    var whitespace = fun_name.indexOf(' ');
                    if (whitespace >= 0) {
                        fun_name = fun_name.substring(0, whitespace);
                    }
                    test_page.test_objects.push(new Test.AnotherWay._test_object_t(fun_name));
                    script_text = script_text.substring(fun_end, script_text.length);
                    fun_start = script_text.indexOf(fun_sig);
                }
            }
        }
        else { // otherwise (not IE) it ought to work like this
            for (var i in Test.AnotherWay._g_test_iframe) {
                // Hack to prevent failure in FF3.0b1 (innerWidth/innerHeight) and FF>=3.5 (sessionStorage)
                if (i == "innerWidth" || i == "innerHeight" || i == "sessionStorage") {
                    continue;
                }
                if (typeof(Test.AnotherWay._g_test_iframe[i]) == 'function') {
                    if (i.substring(0, 4) == "test") {
                        test_page.test_objects.push(new Test.AnotherWay._test_object_t(i));
                    }
                }
            }
        }
    }
    else 
        if (test_page.convention == "jsan") {
            // the test object is already filled with results
            test_page.test_objects.push(Test.AnotherWay._g_test_object_for_jsan);
        }
    
    if (test_page.test_objects.length == 0) {
        Test.AnotherWay._print_result(test_page.url, "No test functions defined in the page", "badtest", null);
        Test.AnotherWay._load_next_page();
        return;
    }
    
    test_page.wait_msg = Test.AnotherWay._print_result(test_page.url, "running tests..<span class=\"counter\">" + test_page.test_objects.length + "</span>", "running", null);
    
    test_page.test_object_i = 0;
    Test.AnotherWay._run_more_tests();
};

Test.AnotherWay._handle_exception = function(o, e, title){
    var s = title + ": " + typeof(e) + ": ";
    if (e.message != null) {
        s += e.message;
    }
    else 
        if (e.description != null) {
            s += e.description;
        }
        else {
            s += e.toString();
        }
    //  if( e.location!=null ) {  // XXX figure out how to display exception location if it's present (like in mozilla)
    //      s+=" location: "+e.location.toString();
    //  }
    o.exception = s;
    s = [];
    if (e.stack) {
        var lines = e.stack.split("\n");
        for (var i = 0; i < lines.length; ++i) {
            // format of the line: func_name(args)@file_name:line_no
            if (lines[i].match(/(\w*)\(([^\)]*)\)@(.*):([^:]*)$/)) {
                var func_name = RegExp.$1;
                if (func_name.length == 0) {
                    func_name = "<anonymous>";
                }
                s.push("in " + func_name + "( " + RegExp.$2 + ") at " + RegExp.$3 + " line " + RegExp.$4 + "\n");
            }
        }
    }
    o.exception_stack = s;
};

Test.AnotherWay._run_more_tests = function(){
    var test_page = Test.AnotherWay._g_tests_queue[0];
    while (test_page.test_object_i < test_page.test_objects.length) {
        Test.AnotherWay._update_msg_counter(test_page.wait_msg, (1 + test_page.test_object_i) + "/" + test_page.test_objects.length);
        var o = test_page.test_objects[test_page.test_object_i];
        if (test_page.convention == "anotherway") {
            try {
                Test.AnotherWay._g_test_iframe[o.name](o);
            } 
            catch (e) {
                Test.AnotherWay._handle_exception(o, e, "");
            }
        } // for "jsan" convention, test has run already
        if (o.delay_actions.length > 0 || o.wait_result_milliseconds > 0) {
            o.delay_total_milliseconds_left += o.wait_result_milliseconds;
            Test.AnotherWay._delay_actions_timeout();
            return;
        }
        ++test_page.test_object_i;
    }
    Test.AnotherWay._unprint_result(test_page.wait_msg);
    Test.AnotherWay._print_result(test_page.url, null, null, test_page.test_objects);
    Test.AnotherWay._load_next_page();
};

Test.AnotherWay._delay_actions_timeout = function(){
    var test_page = Test.AnotherWay._g_tests_queue[0];
    var test_object = test_page.test_objects[test_page.test_object_i];
    var finished = true;
    if (test_object.delay_action_i == null) {
        // set up to start first action
        test_object.delay_action_i = -1;
    }
    else {
        // perform current action
        var milliseconds_passed = (new Date()).getTime() - test_object.delay_prev_timer_time;
        test_object.delay_current_milliseconds_left -= milliseconds_passed;
        test_object.delay_total_milliseconds_left -= milliseconds_passed;
        finished = Test.AnotherWay._delay_continue_action(test_object, milliseconds_passed);
    }
    while (finished && test_object.delay_action_i < test_object.delay_actions.length) {
        ++test_object.delay_action_i; // start next action
        finished = Test.AnotherWay._delay_start_action(test_object);
    }
    if (test_object.delay_action_i <= test_object.delay_actions.length) { // any more actions left ?
        test_object.delay_prev_timer_time = (new Date()).getTime();
        var next_timeout = Test.AnotherWay._g_timeout_granularity;
        if (test_object.delay_current_milliseconds_left < next_timeout) {
            next_timeout = test_object.delay_current_milliseconds_left;
        }
        if (test_object.second_wait_msg != null) {
            Test.AnotherWay._update_msg_counter(test_object.second_wait_msg, (test_object.delay_total_milliseconds_left / 1000).toFixed());
        }
        setTimeout(Test.AnotherWay._delay_actions_timeout, next_timeout);
    }
    else { // no more actions left. run the next test.
        if (test_object.second_wait_msg != null) {
            Test.AnotherWay._unprint_result(test_object.second_wait_msg);
            test_object.second_wait_msg = null;
        }
        ++test_page.test_object_i;
        Test.AnotherWay._run_more_tests();
    }
};

Test.AnotherWay._delay_start_action = function(test_object){
    var finished = false;
    var wait_msg = "";
    if (test_object.delay_action_i == test_object.delay_actions.length) {
        if (test_object.wait_result_milliseconds > 0) {
            test_object.delay_current_milliseconds_left = test_object.wait_result_milliseconds; // wait for result
            wait_msg = "waiting for results..";
        }
        else {
            ++test_object.delay_action_i; // dont wait for result
        }
    }
    else {
        var action = test_object.delay_actions[test_object.delay_action_i];
        if (action.action_kind == "call") {
            test_object.delay_current_milliseconds_left = action.call_delay_milliseconds;
            wait_msg = "performing delayed calls..";
        }
        else 
            if (action.action_kind == "window") {
                if (Test.AnotherWay._g_opera_path_correction != null && action.wnd_url.indexOf(":") == -1) {
                    action.wnd_url = Test.AnotherWay._g_opera_path_correction + action.wnd_url;
                }
                action.wnd_wnd = window.open(action.wnd_url, "_blank");
                if (action.wnd_wnd == null) {
                    finished = true;
                    test_object.fail("unable to open window for " + action.wnd_url);
                }
                else {
                    test_object.delay_current_milliseconds_left = action.wnd_timeout_milliseconds;
                    wait_msg = "opening window..";
                }
            }
            else 
                if (action.action_kind == "replay") {
                    if (action.replay_events.length == 0) {
                        finished = true;
                    }
                    else {
                        action.replay_event_i = 0;
                        test_object.delay_current_milliseconds_left = action.replay_events[0]["time"];
                        wait_msg = "replaying events..";
                    }
                }
    }
    if (test_object.second_wait_msg != null) {
        Test.AnotherWay._unprint_result(test_object.second_wait_msg);
    }
    if (wait_msg != "") {
        var test_page = Test.AnotherWay._g_tests_queue[0];
        test_object.second_wait_msg = Test.AnotherWay._print_counter_result(test_page.url, wait_msg, test_object.delay_total_milliseconds_left, "waiting");
    }
    else {
        test_object.second_wait_msg = null;
    }
    return finished;
};
Test.AnotherWay._delay_continue_action = function(test_object, milliseconds_passed){
    var finished = test_object.delay_current_milliseconds_left <= 0;
    if (test_object.delay_action_i == test_object.delay_actions.length) { // action is "waiting for results"
        if (test_object.n_plan != null && test_object.n_plan == test_object.n_ok + test_object.n_fail) {
            finished = true; // if all assertions results are recorded, don't wait any more
        }
        if (finished) {
            ++test_object.delay_action_i; // move on to the next test
        }
    }
    else {
        var action = test_object.delay_actions[test_object.delay_action_i];
        if (action.action_kind == "call") {
            if (finished) {
                try {
                    action.call_fn();
                } 
                catch (e) {
                    Test.AnotherWay._handle_exception(test_object, e, "in delay_call");
                }
            }
        }
        else 
            if (action.action_kind == "window") {
                test_object.delay_total_milliseconds_left += milliseconds_passed; // for "window", the countdown is suspended since it's unknown how long it will take
                if (Test.AnotherWay._is_url_loaded(action.wnd_url, action.wnd_wnd)) {
                    try {
                        action.wnd_fn(action.wnd_wnd);
                    } 
                    catch (e) {
                        Test.AnotherWay._handle_exception(test_object, e, "in open_window function call");
                    }
                    finished = true;
                }
                else 
                    if (finished) {
                        test_object.fail("unable to open window for url '" + action.wnd_url + "'. timeout expired");
                    }
            }
            else 
                if (action.action_kind == "replay") {
                    if (finished) {
                        //              try {
                        Test.AnotherWay._delay_replay_event(test_object, action.replay_wnd, action.replay_events[action.replay_event_i], action.replay_checkpoints);
                        //              }catch( e ) { // disabled, until I know how to gel location info from an exception
                        //                  Test.AnotherWay._handle_exception( test_object, e, "while replaying event" );
                        //              }
                        ++action.replay_event_i;
                        finished = action.replay_event_i == action.replay_events.length;
                        if (!finished) {
                            test_object.delay_current_milliseconds_left = action.replay_events[action.replay_event_i]["time"];
                        }
                    }
                }
    }
    return finished;
};

Test.AnotherWay._delay_replay_event = function(test_object, wnd, event, checkpoints){
    if (event.type == "_checkpoint") {
        var checkpoint_n = event.which;
        var prev_n_fail = test_object.n_fail;
        checkpoints[checkpoint_n](test_object, wnd);
        var flash_color = prev_n_fail == test_object.n_fail ? "#2f2" : "#f22";
        Test.AnotherWay._record_flash_border(flash_color);
    }
    else 
        if (event.type == "click" || event.type == "mouseover" || event.type == "mouseout" || event.type == "mousemove" || event.type == "mousedown" || event.type == "mouseup") {
            var target = Test.AnotherWay._record_node_path_to_node(event["target"], wnd.document);
            if (target != null) {
                Test.AnotherWay._record_control_update_highlight(target, "ball", event);
                var e = wnd.document.createEvent("MouseEvents");
                var related_target = Test.AnotherWay._record_node_path_to_node(event["relatedTarget"], wnd.document);
                e.initMouseEvent(event["type"], event["cancelable"], event["bubbles"], wnd.document.defaultView, event["detail"], event["screenX"], event["screenY"], event["clientX"], event["clientY"], event["ctrlKey"], event["altKey"], event["shiftKey"], event["metaKey"], event["button"], Test.AnotherWay._record_node_path_to_node(event["relatedTarget"], wnd.document));
                // Firefox 1.0.6 somehow loses relatedTarget somewhere on the way. Pass through our own, for those who choose to care.
                e.passThroughRelatedTarget = related_target;
                target.dispatchEvent(e);
            }
        }
        else 
            if (event.type == "keyup" || event.type == "keydown" || event.type == "keypress") {
                var e = wnd.document.createEvent("KeyboardEvents"); // forget it. Apparently it's not supported neither by mozilla nor by opera.
                e.initKeyboardEvent(event["type"], event["cancelable"], event["bubbles"], wnd.document.defaultView, event["which"], event["which"], event["ctrlKey"], event["altKey"], event["shiftKey"], event["metaKey"], false);
                wnd.document.dispatchEvent(e);
            }
};

Test.AnotherWay._print_counter_result = function(url, msg, milliseconds, style){
    return Test.AnotherWay._print_result(url, msg + "<span class=\"counter\">" + (milliseconds / 1000).toFixed() + "</span>", style, null);
};

Test.AnotherWay._g_result_count = 0; // for assigning unique ids to result paragraphs
// number of pages tested
Test.AnotherWay._g_ok_pages = 0;
Test.AnotherWay._g_fail_pages = 0;

Test.AnotherWay._print_result = function(url, msg, style, test_objects){
    var results = document.getElementById("results");
    var r = results.appendChild(document.createElement("p"));
    r.id = "result" + Test.AnotherWay._g_result_count;
    ++Test.AnotherWay._g_result_count;
    r.onclick = Test.AnotherWay._toggle_detail;
    var text = "<span class=\"bullet\">&nbsp;&nbsp;&nbsp;</span>&nbsp;";
    if (url != "") {
        text += url + ":  ";
    }
    if (msg != null) {
        text += msg;
    }
    if (test_objects != null) {
        // compose summary and detail texts
        var total_ok = 0;
        var total_detail_ok = 0;
        var total_fail = 0;
        var total_detail_fail = 0;
        var no_plan = 0;
        
        var detail = results.appendChild(document.createElement("div"));
        
        if (r.id.match(/^result(\d+)$/)) {
            detail.id = "result_detail" + RegExp.$1;
        }
        
        for (var i = 0; i < test_objects.length; ++i) {
            var o = test_objects[i];
            var p;
            var p_text;
            p = document.createElement("P");
            Test.AnotherWay._set_css_class(p, "result_detail");
            p_text = o.name;
            if (o.n_fail > 0 || o.exception || (o.n_plan != null && o.n_plan != o.n_ok + o.n_fail) || (o.n_plan == null && o.n_ok == 0 && o.n_fail == 0)) {
                ++total_fail;
                p_text += " <span class=\"fail\">";
                if (o.n_plan != null && o.n_plan != o.n_ok + o.n_fail) {
                    p_text += "planned " + o.n_plan + " assertions but got " + (o.n_ok + o.n_fail) + "; ";
                }
                if (o.n_plan == null && o.n_ok == 0 && o.n_fail == 0) {
                    p_text += "test did not output anything";
                }
                else {
                    p_text += " fail " + o.n_fail;
                }
                p_text += "</span>";
            }
            else {
                ++total_ok;
            }
            p_text += " ok " + o.n_ok;
            if (o.n_plan == null) {
                no_plan = 1;
                p_text += " <span class=\"warning\">no plan</span>";
            }
            p.innerHTML = p_text;
            detail.appendChild(p);
            if (o.exception) {
                p = document.createElement("P");
                Test.AnotherWay._set_css_class(p, "result_exception_detail");
                p.innerHTML = "<span class=\"fail\">exception:</span> " + o.exception;
                detail.appendChild(p);
                p = document.createElement("P");
                Test.AnotherWay._set_css_class(p, "result_exception_stack_detail");
                p.innerHTML = o.exception_stack.join("<br/>");
                detail.appendChild(p);
            }
            for (var ii = 0; ii < o.assertions.length; ++ii) {
                var oo = o.assertions[ii];
                var status = oo.ok ? "ok" : "<span class=\"fail\">fail</span>";
                p = document.createElement("P");
                Test.AnotherWay._set_css_class(p, "result_micro_detail");
                p.innerHTML = status;
                p.appendChild(document.createTextNode(" " + oo.name));
                detail.appendChild(p);
            }
            total_detail_ok += o.n_ok;
            total_detail_fail += o.n_fail;
        }
        if (total_fail || total_detail_fail) {
            text += " fail " + total_fail;
        }
        text += " ok " + total_ok + " (detailed:";
        if (total_fail || total_detail_fail) {
            text += " fail " + total_detail_fail;
        }
        text += " ok " + total_detail_ok + ")";
        if (no_plan) {
            text += " <span class=\"warning\">no plan</span>";
        }
        style = total_fail == 0 ? "ok" : "fail";
        detail.style.display = style == "fail" ? "block" : "none";
        detail.style.cursor = "text";
    }
    if (style != null) {
        Test.AnotherWay._set_css_class(r, style);
        if (style == "ok") {
            ++Test.AnotherWay._g_ok_pages;
        }
        else 
            if (style == "fail" || style == "badtest") {
                ++Test.AnotherWay._g_fail_pages;
            }
        var pages_total = "";
        if (Test.AnotherWay._g_fail_pages > 0) {
            pages_total += " fail " + Test.AnotherWay._g_fail_pages;
        }
        pages_total += " ok " + Test.AnotherWay._g_ok_pages;
        
        // also count out the total number of tests in fail and ok
        Test.AnotherWay._openlayers_sum_total_detail_ok  = Test.AnotherWay._openlayers_sum_total_detail_ok || 0;
        Test.AnotherWay._openlayers_sum_total_detail_ok += (total_detail_ok||0);
        
        Test.AnotherWay._openlayers_sum_total_detail_fail  = Test.AnotherWay._openlayers_sum_total_detail_fail || 0;
        Test.AnotherWay._openlayers_sum_total_detail_fail += (total_detail_fail||0);
        
        pages_total+=" (detailed: fail " + Test.AnotherWay._openlayers_sum_total_detail_fail + " | ok " + Test.AnotherWay._openlayers_sum_total_detail_ok + ")";
        
        Test.AnotherWay._update_results_total(pages_total);
    }
    r.innerHTML = text;
    if (results.scrollHeight != null && results.scrollTop != null && results.offsetHeight != null) {
        results.scrollTop = results.scrollHeight - results.offsetHeight;
    }
    // when test_objects is not null, the results are final - good time to clean up
    if (test_objects != null) {
        for (var i = 0; i < test_objects.length; ++i) {
            var actions = test_objects[i].delay_actions;
            for (var action_i = 0; action_i < actions.length; ++action_i) {
                var action = actions[action_i];
                if (action.action_kind == "window" && action.wnd_wnd != null && !action.wnd_no_close) {
                    action.wnd_wnd.close();
                    action.wnd_wnd = null;
                }
            }
        }
    }
    return r;
};

Test.AnotherWay._unprint_result = function(child){
    var results = document.getElementById("results");
    results.removeChild(child);
};

Test.AnotherWay._toggle_detail = function(){
    if (this.id.match(/^result(\d+)$/)) {
        var detail = document.getElementById("result_detail" + RegExp.$1);
        if (detail != null) {
            if (detail.style.display == "none") {
                detail.style.display = "block";
            }
            else 
                if (detail.style.display == "block") {
                    detail.style.display = "none";
                }
        }
    }
};

Test.AnotherWay._update_msg_counter = function(msg, text){
    for (var i = 0; i < msg.childNodes.length; ++i) {
        var item = msg.childNodes[i];
        if (item.nodeName == "SPAN" && Test.AnotherWay._get_css_class(item) == "counter") {
            item.innerHTML = text;
        }
    }
};

Test.AnotherWay._update_results_total = function(msg){
    var total = document.getElementById("total");
    if (total) {
        total.innerHTML = msg;
    }
};

Test.AnotherWay._results_clear_onclick = function(){
    var results = document.getElementById("results");
    results.innerHTML = "";
    Test.AnotherWay._update_results_total("");
    Test.AnotherWay._g_ok_pages = 0;
    Test.AnotherWay._g_fail_pages = 0;
    Test.AnotherWay._openlayers_sum_total_detail_ok=0;
    Test.AnotherWay._openlayers_sum_total_detail_fail=0;
    var debug = document.getElementById("debug");
    debug.innerHTML = "";
    Test.AnotherWay.reset_running_time();
};

Test.AnotherWay._get_css_class = function(o){
    var c = o.getAttribute("className");
    if (c == null || c == "") {
        c = o.getAttribute("class");
    }
    return c;
};

Test.AnotherWay._set_css_class = function(o, css_class){
    o.setAttribute("className", css_class);
    o.setAttribute("class", css_class);
};

Test.AnotherWay._tab_onclick = function(){
    var tab = this;
    var tabs = [document.getElementById("debug_tab"), document.getElementById("results_tab")];
    var panes = [document.getElementById("debug"), document.getElementById("results")];
    for (var i = 0; i < tabs.length; ++i) {
        if (tab == tabs[i]) {
            Test.AnotherWay._set_css_class(tabs[i], "active_tab");
            panes[i].style.display = "block";
        }
        else {
            Test.AnotherWay._set_css_class(tabs[i], "inactive_tab");
            panes[i].style.display = "none";
        }
    }
};
Test.AnotherWay._tab_mouseover = function(){
    if (Test.AnotherWay._get_css_class(this) == "inactive_tab") {
        Test.AnotherWay._set_css_class(this, "inactive_mouseover_tab");
    }
};
Test.AnotherWay._tab_mouseout = function(){
    if (Test.AnotherWay._get_css_class(this) == "inactive_mouseover_tab") {
        Test.AnotherWay._set_css_class(this, "inactive_tab");
    }
};

// recording mouse input
Test.AnotherWay._record_check_onfocus = function(){
    var o = this;
    var check_select = o.type != "text";
    var div = document.getElementById("record_div");
    var inputs = div.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; ++i) {
        var input = inputs[i];
        if (input.type == "radio") {
            if (input.value == "select") {
                input.checked = check_select;
            }
            else 
                if (input.value == "input") {
                    input.checked = !check_select;
                }
        }
    }
};

Test.AnotherWay._g_no_record_msg = null; // not null - recording is unavailable
Test.AnotherWay._g_record_timeout_cnt = 0; // opening window for a page for recording
Test.AnotherWay._g_record_url = null;
Test.AnotherWay._g_record_wnd = null;
Test.AnotherWay._g_record_random_id = null; // added to element ids of record_control div so that they do not clash with ids already in the page for which input is recorded
Test.AnotherWay._g_record_keydown = null; // recording control - which key is down
Test.AnotherWay._g_record_ctrl_keydown = false;
Test.AnotherWay._g_record_shift_keydown = false;
Test.AnotherWay._g_record_control_visible = true; // recording control ui state
Test.AnotherWay._g_record_started;
Test.AnotherWay._g_record_paused;
Test.AnotherWay._g_record_include_mousemove = false;
Test.AnotherWay._g_record_start_time; // for time references
Test.AnotherWay._g_record_pause_start_time;
Test.AnotherWay._g_record_update_time_interval; // showing time in the control ui
Test.AnotherWay._g_record_waiting_for_results = false; // waiting for results window to open
Test.AnotherWay._g_record_events; // recorded events
Test.AnotherWay._g_record_under_cursor; // track element under cursor
Test.AnotherWay._g_record_checkpoint_count; // for checkpoint numbering
Test.AnotherWay._g_record_mouse_over_record_control; // for avoiding record control highlight on mouseover
Test.AnotherWay._g_record_highlighted_element = {
    element: null,
    x: null,
    y: null
};

Test.AnotherWay._record_control_get_element = function(id){
    if (Test.AnotherWay._g_record_wnd != null && Test.AnotherWay._g_record_wnd.document != null) {
        return Test.AnotherWay._g_record_wnd.document.getElementById(id + Test.AnotherWay._g_record_random_id);
    }
    else {
        return null;
    }
};
Test.AnotherWay._record_start_onclick = function() // "record" button on the run_tests.html: open a window for a page for which input is recorded
{
    if (Test.AnotherWay._g_no_record_msg != null) {
        alert(Test.AnotherWay._g_no_record_msg);
        return;
    }
    if (Test.AnotherWay._g_record_timeout_cnt > 0 ||
    (Test.AnotherWay._g_record_wnd != null && (Test.AnotherWay._g_record_wnd.closed != null && !Test.AnotherWay._g_record_wnd.closed))) { // in opera, closed is null.
        alert("there is already window opened for recording input for a page " + Test.AnotherWay._g_record_url);
        return;
    }
    var div = document.getElementById("record_div");
    var inputs = div.getElementsByTagName("input");
    var url = null;
    for (var i = 0; i < inputs.length; ++i) {
        var input = inputs[i];
        if (input.type == "radio") {
            if (input.value == "select" && input.checked) {
                var index = document.getElementById("record_select").selectedIndex;
                if (index > 0) {
                    url = Test.AnotherWay._g_test_page_urls[index - 1].url;
                }
            }
            else 
                if (input.value == "input" && input.checked) {
                    url = document.getElementById("record_input").value;
                }
        }
    }
    if (url != null) {
        Test.AnotherWay._g_record_url = url;
        Test.AnotherWay._g_record_wnd = window.open(url, "_blank");
        if (Test.AnotherWay._g_record_wnd == null) {
            alert("unable to open new window for a page: " + url);
        }
        else {
            Test.AnotherWay._g_record_timeout_cnt = 50;
            setTimeout(Test.AnotherWay._record_window_timeout, 100);
        }
    }
};
Test.AnotherWay._record_window_timeout = function(){
    if (Test.AnotherWay._is_url_loaded(Test.AnotherWay._g_record_url, Test.AnotherWay._g_record_wnd)) {
        Test.AnotherWay._record_window_setup(Test.AnotherWay._g_record_wnd);
    }
    else {
        if (--Test.AnotherWay._g_record_timeout_cnt > 0) {
            setTimeout(Test.AnotherWay._record_window_timeout, 100);
        }
        else {
            alert("timeout expired while opening new window for a page: " + Test.AnotherWay._g_record_url);
            Test.AnotherWay._g_record_wnd = null;
            Test.AnotherWay._g_record_url = null;
            Test.AnotherWay._g_record_timeout_cnt = 0;
        }
    }
};
Test.AnotherWay._record_control_randomize_id = function(e, r){
    if (e.id != "") {
        e.id = e.id + r;
    }
    for (var c = e.firstChild; c != null; c = c.nextSibling) {
        Test.AnotherWay._record_control_randomize_id(c, r);
    }
};
Test.AnotherWay._record_window_setup = function(wnd) // insert recording control into the page for which input is recorded
{
    Test.AnotherWay._g_record_timeout_cnt = 0;
    var this_div = document.getElementById("record_control");
    var record_control = wnd.document.importNode(this_div, true);
    Test.AnotherWay._g_record_random_id = (1000 * Math.random()).toFixed();
    Test.AnotherWay._record_control_randomize_id(record_control, Test.AnotherWay._g_record_random_id);
    Test.AnotherWay._g_record_control_visible = true;
    Test.AnotherWay._g_record_started = false;
    Test.AnotherWay._g_record_paused = false;
    Test.AnotherWay._g_record_checkpoint_count = 0;
    Test.AnotherWay._g_record_mouse_over_record_control = false;
    var doc = wnd.document;
    doc.body.appendChild(record_control);
    // opera sans-serif font is different
    if (window.opera) {
        cursor_over_indicator = Test.AnotherWay._record_control_get_element("record_cursor_over");
        cursor_over_indicator.style.width = "18em";
        cursor_over_indicator.style.height = "2em";
        cursor_over_indicator.style.fontSize = "7pt";
    }
    doc.addEventListener("keydown", Test.AnotherWay._record_control_keydown, true);
    doc.addEventListener("keyup", Test.AnotherWay._record_control_keyup, true);
    //  doc.addEventListener( "keypress", Test.AnotherWay._record_event, true ); // replaying is not supported by any known browser
    
    doc.body.addEventListener("mousemove", Test.AnotherWay._record_on_mousemove, true);
    doc.body.addEventListener("click", Test.AnotherWay._record_event, true);
    doc.body.addEventListener("mouseover", Test.AnotherWay._record_event, true);
    doc.body.addEventListener("mouseout", Test.AnotherWay._record_event, true);
    doc.body.addEventListener("mousedown", Test.AnotherWay._record_event, true);
    doc.body.addEventListener("mouseup", Test.AnotherWay._record_event, true);
};
Test.AnotherWay._record_control_key_disabled = function(k){
    if (k == "c") {
        return !Test.AnotherWay._g_record_started;
    }
    else 
        if (k == "p") {
            return !Test.AnotherWay._g_record_started;
        }
        else 
            if (k == "s") {
                return Test.AnotherWay._g_record_waiting_for_results;
            }
            else {
                return false;
            }
};

Test.AnotherWay._record_control_update_ui = function(){
    var keydown_color = "#fff";
    var disabled_color = "#aaa";
    var button_color = "#adf";
    var active_color = "#fdf";
    
    var display = {};
    display[false] = "none";
    display[true] = "inline";
    
    var s_button = Test.AnotherWay._record_control_get_element("record_s");
    var record_on = Test.AnotherWay._record_control_get_element("record_on");
    var record_off = Test.AnotherWay._record_control_get_element("record_off");
    
    s_button.style.backgroundColor = Test.AnotherWay._record_control_key_disabled("s") ? disabled_color : Test.AnotherWay._g_record_keydown == "s" ? keydown_color : Test.AnotherWay._g_record_started ? active_color : button_color;
    record_on.style.display = display[!Test.AnotherWay._g_record_started];
    record_off.style.display = display[Test.AnotherWay._g_record_started];
    
    var h_button = Test.AnotherWay._record_control_get_element("record_h");
    h_button.style.backgroundColor = Test.AnotherWay._g_record_keydown == "h" ? keydown_color : button_color;
    
    var p_button = Test.AnotherWay._record_control_get_element("record_p");
    var record_pause_on = Test.AnotherWay._record_control_get_element("record_pause_on");
    var record_pause_off = Test.AnotherWay._record_control_get_element("record_pause_off");
    p_button.style.backgroundColor = Test.AnotherWay._record_control_key_disabled("p") ? disabled_color : Test.AnotherWay._g_record_keydown == "p" ? keydown_color : Test.AnotherWay._g_record_paused ? active_color : button_color;
    record_pause_on.style.display = display[!Test.AnotherWay._g_record_paused];
    record_pause_off.style.display = display[Test.AnotherWay._g_record_paused];
    
    var m_button = Test.AnotherWay._record_control_get_element("record_m");
    var record_include_mousemove = Test.AnotherWay._record_control_get_element("record_include_mousemove");
    var record_omit_mousemove = Test.AnotherWay._record_control_get_element("record_omit_mousemove");
    m_button.style.backgroundColor = Test.AnotherWay._g_record_keydown == "m" ? keydown_color : Test.AnotherWay._g_record_include_mousemove ? active_color : button_color;
    record_include_mousemove.style.display = display[!Test.AnotherWay._g_record_include_mousemove];
    record_omit_mousemove.style.display = display[Test.AnotherWay._g_record_include_mousemove];
    
    var c_button = Test.AnotherWay._record_control_get_element("record_c");
    c_button.style.backgroundColor = Test.AnotherWay._record_control_key_disabled("c") ? disabled_color : Test.AnotherWay._g_record_keydown == "c" ? keydown_color : button_color;
    
    var record_indicator = Test.AnotherWay._record_control_get_element("record_indicator");
    record_indicator.style.display = display[Test.AnotherWay._g_record_started];
    
    var pause_indicator = Test.AnotherWay._record_control_get_element("record_pause_indicator");
    pause_indicator.style.display = display[Test.AnotherWay._g_record_paused];
    
    var record_control = Test.AnotherWay._record_control_get_element("record_control");
    record_control.style.display = Test.AnotherWay._g_record_control_visible ? "block" : "none";
    
    var shift_button = Test.AnotherWay._record_control_get_element("record_shift_key");
    shift_button.style.backgroundColor = Test.AnotherWay._g_record_shift_keydown ? keydown_color : button_color;
    
    var ctrl_button = Test.AnotherWay._record_control_get_element("record_ctrl_key");
    ctrl_button.style.backgroundColor = Test.AnotherWay._g_record_ctrl_keydown ? keydown_color : button_color;
};
Test.AnotherWay._record_format_time = function(t){
    t = new Date(t);
    var m = t.getMinutes();
    var s = t.getSeconds();
    var str = m == 0 ? "" : m + "m ";
    str += s + "s.";
    return str;
};
Test.AnotherWay._record_control_update_time = function(){
    var time_display = Test.AnotherWay._record_control_get_element("record_time");
    if (time_display != null) {
        time_display.innerHTML = Test.AnotherWay._record_format_time((new Date()).getTime() - Test.AnotherWay._g_record_start_time);
    }
};
Test.AnotherWay._record_control_update_highlight = function(elem, style, event){
    if (elem == null) {
        Test.AnotherWay._record_highlight_border(null);
    }
    else {
        var pos = Test.AnotherWay._get_page_coords(elem);
        if (style == "ball" || elem != Test.AnotherWay._g_record_highlighted_element.element || pos.x != Test.AnotherWay._g_record_highlighted_element.x || pos.y != Test.AnotherWay._g_record_highlighted_element.y) {
            Test.AnotherWay._g_record_highlighted_element = {
                element: elem,
                x: pos.x,
                y: pos.y
            };
            Test.AnotherWay._record_highlight_border(elem, style, event);
        }
    }
};
Test.AnotherWay._record_decode_key = function(event){
    var k = null;
    if (event == null) {
        k = Test.AnotherWay._g_record_wnd.event.keyCode;
    }
    else {
        k = event.which;
    }
    if (k == 83) {
        return "s";
    }
    else 
        if (k == 72) {
            return "h";
        }
        else 
            if (k == 73) {
                return "i";
            }
            else 
                if (k == 80) {
                    return "p";
                }
                else 
                    if (k == 67) {
                        return "c";
                    }
                    else 
                        if (k == 77) {
                            return "m";
                        }
                        else 
                            if (k == 16) {
                                return "shift";
                            }
                            else 
                                if (k == 17) {
                                    return "ctrl";
                                }
                                else 
                                    if (k == 18) {
                                        return "alt";
                                    }
                                    else 
                                        if (k == 19) {
                                            return "pause";
                                        }
                                        else 
                                            if (k == 123) {
                                                return "f12";
                                            }
    return "";
};
Test.AnotherWay._record_control_keydown = function(event){
    var handled = false;
    var k = Test.AnotherWay._record_decode_key(event);
    if (k == "shift") {
        Test.AnotherWay._g_record_shift_keydown = true;
    }
    else 
        if (k == "ctrl") {
            Test.AnotherWay._g_record_ctrl_keydown = true;
        }
        else 
            if (k != "" && (Test.AnotherWay._g_record_keydown == null || Test.AnotherWay._g_record_keydown == k)) {
                if (Test.AnotherWay._g_record_ctrl_keydown && Test.AnotherWay._g_record_shift_keydown && !Test.AnotherWay._record_control_key_disabled(k)) {
                    Test.AnotherWay._g_record_keydown = k;
                    handled = true;
                }
            }
            else {
                Test.AnotherWay._g_record_keydown = "";
            }
    Test.AnotherWay._record_control_update_ui();
    if (!handled) {
        //      Test.AnotherWay._record_event( event ); // replaying is not supported in any known browser
    }
    return;
};
Test.AnotherWay._record_control_keyup = function(event){
    var handled = false;
    var k = Test.AnotherWay._record_decode_key(event);
    if (k == "shift") {
        Test.AnotherWay._g_record_shift_keydown = false;
    }
    else 
        if (k == "ctrl") {
            Test.AnotherWay._g_record_ctrl_keydown = false;
        }
        else 
            if (k != "" && k == Test.AnotherWay._g_record_keydown && Test.AnotherWay._g_record_ctrl_keydown && Test.AnotherWay._g_record_shift_keydown) {
                if (k == "s") {
                    Test.AnotherWay._g_record_started = !Test.AnotherWay._g_record_started;
                    if (Test.AnotherWay._g_record_started) {
                        Test.AnotherWay._g_record_events = [];
                        Test.AnotherWay._g_record_start_time = (new Date()).getTime();
                        Test.AnotherWay._record_control_update_time();
                        Test.AnotherWay._g_record_update_time_interval = window.setInterval(Test.AnotherWay._record_control_update_time, 200);
                    }
                    else {
                        Test.AnotherWay._record_control_update_highlight(null);
                        if (!Test.AnotherWay._g_record_paused) {
                            window.clearInterval(Test.AnotherWay._g_record_update_time_interval);
                        }
                        Test.AnotherWay._g_record_waiting_for_results = true;
                        // open a new window for self, pass a parameter to dump recorded events as javascript code there
                        // (the easiest way to obtain a document from the same origin, so it's writable, is to open this same page again)
                        Test.AnotherWay._g_record_paused = false;
                        var loc = window.location;
                        loc = loc.protocol + "//" + loc.host + loc.pathname + "?recording_results=" + Test.AnotherWay._g_record_random_id;
                        if (window.open(loc, "_blank") == null) {
                            alert("unable to open new window for results");
                        }
                    }
                    handled = true;
                }
                else 
                    if (k == "h") {
                        Test.AnotherWay._g_record_control_visible = !Test.AnotherWay._g_record_control_visible;
                        handled = true;
                    }
                    else 
                        if (k == "p") {
                            Test.AnotherWay._g_record_paused = !Test.AnotherWay._g_record_paused;
                            if (Test.AnotherWay._g_record_paused) {
                                Test.AnotherWay._g_record_pause_start_time = (new Date()).getTime();
                                if (Test.AnotherWay._g_record_started) {
                                    window.clearInterval(Test.AnotherWay._g_record_update_time_interval);
                                }
                                Test.AnotherWay._record_control_update_highlight(null);
                            }
                            else {
                                var pause_duration = (new Date()).getTime() - Test.AnotherWay._g_record_pause_start_time;
                                Test.AnotherWay._g_record_start_time += pause_duration;
                                Test.AnotherWay._g_record_update_time_interval = window.setInterval(Test.AnotherWay._record_control_update_time, 200);
                            }
                            handled = true;
                        }
                        else 
                            if (k == "m") {
                                Test.AnotherWay._g_record_include_mousemove = !Test.AnotherWay._g_record_include_mousemove;
                                handled = true;
                            }
                            else 
                                if (k == "c") {
                                    var o = Test.AnotherWay._record_checkpoint();
                                    Test.AnotherWay._record_display_checkpoint(o);
                                    Test.AnotherWay._record_flash_border("#24d");
                                    handled = true;
                                }
            }
    Test.AnotherWay._g_record_keydown = null;
    Test.AnotherWay._record_control_update_ui();
    if (!handled) {
        //      Test.AnotherWay._record_event( event ); // replaying is not supported in any known browser
    }
    return;
};
Test.AnotherWay._record_html_node_path = function(node){
    if (node == null) {
        return null;
    }
    var path = [];
    while (true) {
        if (node.id != null && node.id != "") {
            path.unshift("#" + node.id + " " + node.nodeName);
            break;
        }
        else {
            var parent_node = node.parentNode;
            if (parent_node == null) {
                return []; // no BODY up the path - this node is screwed (browsers differ in what's above the body), discard
            }
            else {
                var i = 0;
                var found = false;
                for (var child = parent_node.firstChild; child != null; child = child.nextSibling) {
                    if (child == node) {
                        found = true;
                        break;
                    }
                    if (child.nodeType == 1) { // count only HTML element nodes
                        ++i;
                    }
                }
                if (!found) {
                    i = -1;
                }
                path.unshift(i + " " + node.nodeName);
                if (parent_node.nodeName == "BODY" || parent_node.nodeName == "body") {
                    break;
                }
                node = parent_node;
            }
        }
    }
    return path;
};
Test.AnotherWay._record_node_path_to_string = function(path){
    var s = "";
    if (path != null) {
        for (var i = 0; i < path.length; ++i) {
            s += i == 0 ? "" : ", ";
            var elem = path[i].split(" ");
            if (elem[0].charAt(0) == "#") {
                s += elem[1] + " " + elem[0];
            }
            else {
                s += elem[1] + " [" + elem[0] + "]";
            }
        }
    }
    return s;
};
Test.AnotherWay._record_node_path_to_node = function(path_str, doc){
    if (path_str == null) {
        return null;
    }
    var path = path_str.split(",");
    var node = doc.body;
    for (var i = 0; i < path.length; ++i) {
        var node_i = path[i].split(" ")[0];
        if (node_i.charAt(0) == "#") {
            node = doc.getElementById(node_i.substring(1));
        }
        else {
            if (node_i < 0 || node_i >= node.childNodes.length) {
                node = null;
            }
            else {
                node = node.firstChild;
                while (node != null) {
                    if (node.nodeType == 1) { // count only HTML element nodes
                        if (node_i == 0) {
                            break;
                        }
                        --node_i;
                    }
                    node = node.nextSibling;
                }
            }
        }
        if (node == null) {
            return null;
        }
    }
    return node;
};
Test.AnotherWay._record_control_contains_id = function(s){
    return s.match(/^#record_[\w_]+/) && s.match(Test.AnotherWay._g_record_random_id);
};
Test.AnotherWay._record_checkpoint = function(){
    var o = {
        type: "_checkpoint",
        time: (new Date()).getTime() - Test.AnotherWay._g_record_start_time,
        which: Test.AnotherWay._g_record_checkpoint_count++,
        target: Test.AnotherWay._record_html_node_path(Test.AnotherWay._g_record_under_cursor)
    };
    Test.AnotherWay._g_record_events.push(o);
    return o;
};
Test.AnotherWay._record_event = function(event){
    var unneeded = ["rangeOffset", "eventPhase", "timeStamp", "isTrusted", "popupWindowFeatures", "rangeOffset"];
    if (Test.AnotherWay._g_record_started && !Test.AnotherWay._g_record_paused) {
        var o = {};
        for (var n in event) {
            var needed = !n.match(/^[A-Z0-9_]+$/);
            if (needed) {
                for (var ui = 0; ui < unneeded.length; ++ui) {
                    if (unneeded[ui] == n) {
                        needed = false;
                        break;
                    }
                }
                if (needed) {
                    var value = event[n];
                    if (typeof(value) != "object" && typeof(value) != "function") {
                        o[n] = value;
                    }
                    else 
                        if (n == "target" || n == "relatedTarget") {
                            o[n] = Test.AnotherWay._record_html_node_path(value);
                        }
                }
            }
        }
        o["time"] = (new Date()).getTime() - Test.AnotherWay._g_record_start_time;
        var over_record_control = o["target"] != null && o["target"][0] != null && Test.AnotherWay._record_control_contains_id(o["target"][0]);
        if (!over_record_control) {
            Test.AnotherWay._g_record_events.push(o);
        }
    }
    return true;
};
Test.AnotherWay._record_on_mousemove = function(event){
    var path = Test.AnotherWay._record_html_node_path(event.target);
    var new_mouse_over_record_control = path != null && path[0] != null && Test.AnotherWay._record_control_contains_id(path[0]);
    if (new_mouse_over_record_control != Test.AnotherWay._g_record_mouse_over_record_control) {
        Test.AnotherWay._g_record_mouse_over_record_control = new_mouse_over_record_control;
        Test.AnotherWay._record_control_update_ui();
    }
    if (event.target != null && event.target != Test.AnotherWay._g_record_under_cursor) {
        Test.AnotherWay._g_record_under_cursor = event.target;
        var s = "";
        if (path == null || path[0] == null || !Test.AnotherWay._record_control_contains_id(path[0])) {
            s = Test.AnotherWay._record_node_path_to_string(path);
        }
        if (s == "") {
            s = "&nbsp;";
        }
        var cursor_over_indicator = Test.AnotherWay._record_control_get_element("record_cursor_over");
        cursor_over_indicator.innerHTML = s;
    }
    
    var highlight_element = null;
    if (!Test.AnotherWay._g_record_mouse_over_record_control && Test.AnotherWay._g_record_started && !Test.AnotherWay._g_record_paused) {
        highlight_element = event.target;
    }
    // highlight border disabled on recording - it causes page to scroll, issuing spurious mouseover/mouseout event
    //Test.AnotherWay._record_control_update_highlight( highlight_element, "border" );
    
    if (Test.AnotherWay._g_record_include_mousemove) {
        Test.AnotherWay._record_event(event);
    }
    return true;
};
Test.AnotherWay._record_display_checkpoint = function(o){
    var checkpoints_div = Test.AnotherWay._record_control_get_element("record_checkpoints");
    var p = checkpoints_div.appendChild(checkpoints_div.ownerDocument.createElement("div"));
    p.style.marginTop = "3px";
    p.style.font = "normal normal 8pt sans-serif";
    p.style.color = "#000";
    p.style.textAligh = "left";
    p.style.position = "relative";
    p.style.width = "100%";
    var checkpoint_text = "";
    checkpoint_text += "#" + (o.which + 1);
    checkpoint_text += "  " + Test.AnotherWay._record_format_time(o.time);
    if (o.target != null) {
        checkpoint_text += Test.AnotherWay._record_node_path_to_string(o.target);
    }
    p.appendChild(p.ownerDocument.createTextNode(checkpoint_text));
};
Test.AnotherWay._record_save_results = function(doc){
    // strange, but DOM-style append does not work here in opera 8.
    var append = function(s){
        doc.write("<div>" + s + "</div>");
    };
    append("/* paste this data into your javascript and pass it as an argument to replay_events method */");
    append("{ checkpoints: [");
    var first_checkpoint = true;
    for (var i = 0; i < Test.AnotherWay._g_record_events.length; ++i) {
        var o = Test.AnotherWay._g_record_events[i];
        if (o.type == "_checkpoint") {
            var str = first_checkpoint ? "" : "}, ";
            str += "function( tst, wnd ) { // #" + o.which + " time " + Test.AnotherWay._record_format_time(o.time) + " cursor was over " + Test.AnotherWay._record_node_path_to_string(o.target);
            append(str);
            first_checkpoint = false;
        }
    }
    if (!first_checkpoint) {
        append("}");
    }
    append("], events: [ ");
    var prev_time = 0;
    for (var i = 0; i < Test.AnotherWay._g_record_events.length; ++i) {
        var o = Test.AnotherWay._g_record_events[i];
        var s = "";
        s += "{";
        var n_first = true;
        for (var n in o) {
            if (n == "time") { // convert to relative time
                var cur_time = o[n] - 0;
                o[n] = cur_time - prev_time;
                prev_time = cur_time;
            }
            s += n_first ? n : ", " + n;
            s += ":";
            if (o[n] == null) {
                s += "null";
            }
            else {
                s += "\"" + o[n] + "\"";
            }
            n_first = false;
        }
        s += i == Test.AnotherWay._g_record_events.length - 1 ? "}" : "},";
        append(s);
    }
    append("] }");
    append(";");
};

Test.AnotherWay._g_record_border; // border highlighting element under cursor
Test.AnotherWay._g_record_border_flashes = []; // array of { color: color, timeout: milliseconds }
Test.AnotherWay._g_record_border_flashing = false;
Test.AnotherWay._g_record_border_normal_color = "#d4b";
Test.AnotherWay._record_flash_border_timeout = function(){
    var color = Test.AnotherWay._g_record_border_normal_color;
    var timeout = null;
    if (Test.AnotherWay._g_record_border_flashes.length != 0) {
        color = Test.AnotherWay._g_record_border_flashes[0].color;
        timeout = Test.AnotherWay._g_record_border_flashes[0].timeout;
        Test.AnotherWay._g_record_border_flashes.splice(0, 1);
    }
    if (Test.AnotherWay._g_record_border != null) {
        for (var i = 0; i < Test.AnotherWay._g_record_border.length; ++i) {
            Test.AnotherWay._g_record_border[i].style.backgroundColor = color;
        }
    }
    if (timeout != null) {
        setTimeout(Test.AnotherWay._record_flash_border_timeout, timeout);
    }
    else {
        Test.AnotherWay._g_record_border_flashing = false;
    }
};
Test.AnotherWay._get_page_coords = function(elm){
    var point = {
        x: 0,
        y: 0
    };
    while (elm) {
        point.x += elm.offsetLeft;
        point.y += elm.offsetTop;
        elm = elm.offsetParent;
    }
    return point;
};
Test.AnotherWay._set_page_coords = function(elm, x, y){
    var parent_coords = {
        x: 0,
        y: 0
    };
    if (elm.offsetParent) {
        parent_coords = Test.AnotherWay._get_page_coords(elm.offsetParent);
    }
    var new_x = x - parent_coords.x;
    if (new_x < 0) {
        new_x = 0;
    }
    elm.style.left = new_x + 'px';
    var new_y = y - parent_coords.y;
    if (new_y < 0) {
        new_y = 0;
    }
    elm.style.top = new_y + 'px';
};
Test.AnotherWay._record_setup_highlight_positions = function(element, style, coords, positions){
    if (style == "border") {
        var width = element.clientWidth;
        var height = element.clientHeight;
        var step = 0;
        var thickness = 2;
        var fudge_expand = 4;
        positions.push({
            x: coords.x - step - thickness,
            y: coords.y - step - thickness,
            width: width + 2 * step + 2 * thickness + fudge_expand,
            height: thickness
        });
        positions.push({
            x: coords.x + width + step + fudge_expand,
            y: coords.y - step - thickness,
            width: thickness,
            height: height + 2 * step + 2 * thickness + fudge_expand
        });
        positions.push({
            x: positions[0].x,
            y: positions[0].y,
            width: positions[0].width,
            height: positions[0].height
        });
        positions.push({
            x: positions[1].x,
            y: positions[1].y,
            width: positions[1].width,
            height: positions[1].height
        });
        positions[2].y += height + thickness + 2 * step + fudge_expand;
        positions[3].x -= width + thickness + 2 * step + fudge_expand;
    }
    else 
        if (style == "ball") {
            positions.push({
                x: coords.x + 2,
                y: coords.y,
                width: 2,
                height: 6
            });
            positions.push({
                x: coords.x,
                y: coords.y + 2,
                width: 6,
                height: 2
            });
            positions.push({
                x: coords.x + 1,
                y: coords.y + 1,
                width: 4,
                height: 4
            });
        }
};
Test.AnotherWay._record_highlight_border = function(element, style, event) // null - hide border
{
    if (element != null) {
        if (Test.AnotherWay._g_record_border == null || Test.AnotherWay._g_record_border[0].ownerDocument != element.ownerDocument) {
            Test.AnotherWay._g_record_border = [];
            var n = style == "border" ? 4 : style == "ball" ? 3 : 0;
            for (var i = 0; i < 4; ++i) {
                var b = element.ownerDocument.createElement("div");
                b.style.position = "absolute";
                b.style.zIndex = "1";
                b.style.backgroundColor = Test.AnotherWay._g_record_border_normal_color;
                element.ownerDocument.body.appendChild(b);
                Test.AnotherWay._g_record_border.push(b);
            }
        }
        var coords = null;
        if (style == "border") {
            coords = Test.AnotherWay._get_page_coords(element);
        }
        else 
            if (style == "ball") {
                if (event != null) {
                    if (event.pageX != null && event.pageY != null) {
                        coords = {
                            x: event.pageX - 0,
                            y: event.pageY - 0
                        };
                    }
                    else 
                        if (event.clientX != null && event.clientY != null) {
                            var doc = element.ownerDocument;
                            if (doc != null) {
                                coords = {
                                    x: (event.clientX - 0) + doc.body.scrollLeft,
                                    y: (event.clientY - 0) + doc.body.scrollTop
                                };
                            }
                        }
                }
            }
        if (coords != null && element.clientWidth != null && element.clientHeight != null) {
            var positions = [];
            Test.AnotherWay._record_setup_highlight_positions(element, style, coords, positions);
            for (var i = 0; i < positions.length; ++i) {
                var b = Test.AnotherWay._g_record_border[i];
                var p = positions[i];
                Test.AnotherWay._set_page_coords(b, p.x, p.y);
                b.style.width = p.width + "px";
                b.style.height = p.height + "px";
                b.style.display = "block";
            }
        }
    }
    else {
        if (Test.AnotherWay._g_record_border != null) {
            for (var i = 0; i < Test.AnotherWay._g_record_border.length; ++i) {
                Test.AnotherWay._g_record_border[i].style.display = "none";
            }
        }
    }
};
Test.AnotherWay._record_flash_border = function(color){
    if (Test.AnotherWay._g_record_border_flashing) { //already
        Test.AnotherWay._g_record_border_flashes.push({
            color: Test.AnotherWay._g_record_border_normal_color,
            timeout: 300
        });
        Test.AnotherWay._g_record_border_flashes.push({
            color: color,
            timeout: 600
        });
    }
    else {
        Test.AnotherWay._g_record_border_flashing = true;
        Test.AnotherWay._g_record_border_flashes.push({
            color: color,
            timeout: 600
        });
        Test.AnotherWay._record_flash_border_timeout();
    }
};
Test.AnotherWay._record_prepare_doc_for_results = function(){
    document.open();
    document.write("<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\" \"http://www.w3.org/TR/html4/strict.dtd\">");
    document.write("<html><head><title> Input recording results</title>");
    document.write("<style type=\"text/css\">");
    document.write("body { font: normal normal smaller sans-serif; }");
    document.write("div { margin-top: 3px; }");
    document.write("</style></head><body>");
    // opera and mozilla disagree over who the opener is.
    if (typeof(window.opener.Test) != "undefined" && typeof(window.opener.Test.AnotherWay) != "undefined") {
        window.opener.Test.AnotherWay._record_save_results(document);
        window.opener.Test.AnotherWay._g_record_waiting_for_results = false;
        window.opener.Test.AnotherWay._record_control_update_ui();
    }
    else 
        if (typeof(window.opener.opener.Test) != "undefined" && typeof(window.opener.opener.Test.AnotherWay) != "undefined") {
            window.opener.opener.Test.AnotherWay._record_save_results(document);
            window.opener.opener.Test.AnotherWay._g_record_waiting_for_results = false;
            window.opener.opener.Test.AnotherWay._record_control_update_ui();
        }
    document.write("</body>");
    document.close();
};

// global initialization
onload = function(){
    if (window.opera) {
        var good_opera = typeof(window.opera.version) == "function";
        good_opera = good_opera && window.opera.version().match(/^\s*(\d+)/);
        good_opera = good_opera && RegExp.$1 >= 8;
    }
    var span = document.createElement("SPAN");
    span.innerHTML = "<!--[if IE]><br /><![endif]-" + "->";
    var is_ie = span.getElementsByTagName("BR").length > 0;
    
    Test.AnotherWay._g_test_iframe = window.frames.test_iframe;
    
    var query_str = window.location.search;
    if (query_str.charAt(0) == "?") {
        query_str = query_str.substring(1);
    }
    var testlist_page = "list-tests.html";
    var auto_run = false;
    if (query_str != "") {
        var params = [query_str];
        if (query_str.indexOf(";") != -1) {
            params = query_str.split(";");
        }
        else 
            if (query_str.indexOf("&") != -1) {
                params = query_str.split("&");
            }
        for (var param_i = 0; param_i < params.length; ++param_i) {
            var param = params[param_i].split("=");
            if (param[0] == "recording_results") {
                if (window.opener != null) {
                    // we were told to show recording results - replace everything in the document with the results
                    Test.AnotherWay._record_prepare_doc_for_results();
                    return;
                }
            }
            else 
                if (param[0] == "testpage") {
                    Test.AnotherWay._add_test_page_url(decodeURIComponent(param[1]), "anotherway");
                }
                else 
                    if (param[0] == "jsantestpage") {
                        Test.AnotherWay._add_test_page_url(decodeURIComponent(param[1]), "jsan");
                    }
                    else 
                        if (param[0] == "testlist") {
                            testlist_page = decodeURIComponent(param[1]);
                        }
                        else 
                            if (param[0] == "testframe") {
                                if (window.opera && !good_opera) {
                                    Test.AnotherWay._show_error("testframe parameter does not work in versions of Opera prior to 8.0. Sorry (pathches are welcome).");
                                // Opera 7 barfs on attempt to access frame.frameElement.
                                // if someone knows a way to assign onload handler to that iframe in Opera 7
                                // without disrupting code that works in other browsers, patches are welcome.
                                }
                                else {
                                    var frame_path = param[1].split(".");
                                    var frame = top;
                                    for (var frame_path_i = 0; frame_path_i < frame_path.length; ++frame_path_i) {
                                        frame = frame[frame_path[frame_path_i]];
                                    }
                                    if (frame == null) {
                                        Test.AnotherWay._show_error("unable to find frame specified for loading test pages: " + param[1]);
                                    }
                                    else {
                                        if (frame.frameElement != null) { // for the following assignement to onload to work, frameElement is required
                                            frame = frame.frameElement;
                                        }
                                        Test.AnotherWay._g_test_iframe = frame;
                                    }
                                }
                            }
                            else 
                                if (param[0] == "testframe_no_clear") {
                                    Test.AnotherWay._g_test_frame_no_clear = true;
                                }
                                else 
                                    if (param[0] == "windows") {
                                        if (param[1] == "none") {
                                            Test.AnotherWay._test_object_t.prototype.open_window = null;
                                        }
                                    }
                                    else 
                                        if (param[0] == "run") {
                                            auto_run = true;
                                            if (param[1] == "all") {
                                                Test.AnotherWay._g_pages_to_run = "all";
                                            }
                                            else {
                                                if (Test.AnotherWay._g_pages_to_run == null || Test.AnotherWay._g_pages_to_run == "all") {
                                                    Test.AnotherWay._g_pages_to_run = [];
                                                }
                                                var pages = param[1].split(",");
                                                for (var i = 0; i < pages.length; ++i) {
                                                    Test.AnotherWay._g_pages_to_run.push(pages[i]);
                                                }
                                            }
                                        }
        }
    }
    if (Test.AnotherWay._g_test_page_urls.length == 0) { // if no individual pages were given on the command line, load the list
        var result = Test.AnotherWay._set_iframe_location(window.frames["list_iframe"], testlist_page);
        if (result.msg != null) {
            Test.AnotherWay._show_error(result.msg);
        }
        Test.AnotherWay._g_run_on_list_load = auto_run;
    }
    else {
        Test.AnotherWay._g_run_on_main_load = auto_run;
    }
    
    var f = Test.AnotherWay._g_test_iframe;
    try {
        if (f.attachEvent != null) {
            f.attachEvent("onload", Test.AnotherWay._test_page_onload);
        }
        else {
            f.onload = Test.AnotherWay._test_page_onload;
        }
        if (Test.AnotherWay._g_test_iframe.nodeType != null && Test.AnotherWay._g_test_iframe.contentWindow != null) { // it's iframe element, not the iframe. we need iframe.
            Test.AnotherWay._g_test_iframe = Test.AnotherWay._g_test_iframe.contentWindow;
        }
    } 
    catch (e) {
        // ignore stupid opera error if the frame has onload handler assigned in the inline html
    }
    var handlers = {
        "run_all": {
            "onclick": Test.AnotherWay._run_all_onclick
        },
        "run_selected": {
            "onclick": Test.AnotherWay._run_selected_onclick
        },
        "unselect_all": {
            "onclick": Test.AnotherWay._unselect_all_onclick
        },
        "record_select": {
            "onfocus": Test.AnotherWay._record_check_onfocus
        },
        "record_input": {
            "onfocus": Test.AnotherWay._record_check_onfocus
        },
        "record_start": {
            "onclick": Test.AnotherWay._record_start_onclick
        },
        "clear_btn": {
            "onclick": Test.AnotherWay._results_clear_onclick
        },
        "results_tab": {
            "onclick": Test.AnotherWay._tab_onclick,
            "onmouseover": Test.AnotherWay._tab_mouseover,
            "onmouseout": Test.AnotherWay._tab_mouseout
        },
        "debug_tab": {
            "onclick": Test.AnotherWay._tab_onclick,
            "onmouseover": Test.AnotherWay._tab_mouseover,
            "onmouseout": Test.AnotherWay._tab_mouseout
        }
    };
    for (var hs in handlers) {
        var o = document.getElementById(hs);
        if (o != null) {
            for (var h in handlers[hs]) {
                o[h] = handlers[hs][h];
            }
        }
        else {
            Test.AnotherWay._show_error("unable to set " + h + " handler: id " + hs + " not found");
        }
    }
    
    if (window.opera && !good_opera) {
        Test.AnotherWay._g_no_record_msg = "Input events recording and replaying is not available in opera versions prior to 8.0.";
    }
    if (is_ie) {
        Test.AnotherWay._g_no_record_msg = "Input events recording and replaying is not available in internet explorer.";
    }
    if (Test.AnotherWay._g_no_record_msg != null) {
        var no_record_p = document.getElementById("record_not_supported");
        no_record_p.style.display = "block";
        no_record_p.appendChild(document.createTextNode(Test.AnotherWay._g_no_record_msg));
    }
    
    Test.AnotherWay._g_main_loaded = true;
    if (Test.AnotherWay._g_run_on_main_load) {
        Test.AnotherWay._g_run_on_main_load = false;
        Test.AnotherWay._run_pages_to_run();
    }
};
