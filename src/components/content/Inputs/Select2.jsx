import React, { Component } from 'react';
import PropTypes from 'prop-types';
import select2 from 'select2';
import 'select2/dist/css/select2.css';

import './Select2.css';
import InputWrapper from './InputWrapper';
import { arrayEquals } from '../../Utilities';

const $ = require('jquery');
// test2

const optionToSelect2 = (scopedOptions, simple) => (!simple
  ? scopedOptions.map(({ value: id, label: text, ...props }) => ({ id, text: text || id, ...props }))
  : scopedOptions.map(p => ({ id: p, text: p })));

const optionsFromSelect2 = (select2Options, simple, usesLabels) => (!simple
  ? select2Options.map((p) => {
    if (usesLabels) {
      const { id: value, text: label, ...props } = p;
      return { value, label, ...props };
    }
    const { id: value, ...props } = p;
    return { value, ...props };
  })
  : select2Options.map(({ id }) => id));

const getValue = (select2Options, simple, usesLabels, multiple) => {
  let value = optionsFromSelect2(select2Options, simple, usesLabels);
  if (!multiple && value.length > 0) {
    [value] = value;
  }
  return value;
};

class Select2 extends Component {
  state = {}

  boundHandlers = {}

  componentDidMount() {
    const {
      placeholder, multiple, options, ...props
    } = this.props;
    const isSimpleArray = options.find(p => !p.value);
    const usesLabels = options.find(p => !!p.label);
    this.usesLabels = usesLabels;
    this.isSimpleArray = isSimpleArray;
    const data = optionToSelect2(options, isSimpleArray, usesLabels);
    const $ref = $(this.domRef).select2({
      placeholder,
      data,
    });

    const handleEvent = (event, callback) => {
      const { params } = event;
      const { data: data2 } = params || {};
      if (data2) {
        // null
      } else {
        // const { target: { value } } = event;
      }
      const value = getValue($ref.select2('data'), isSimpleArray, usesLabels, multiple);
      callback(value);
    };
    const boundHandlers = {};

    const bindEvent = ([eventName, callback]) => {
      const jQueryEvent = this.toJQueryEvent(eventName);

      const actualCallback = (e) => { handleEvent(e, callback); };
      boundHandlers[eventName] = { callback, actualCallback, jQueryEvent };
      $ref.on(jQueryEvent, actualCallback);
    };

    Object.entries(props)
      .filter(([key]) => key.startsWith('on'))
      .forEach(bindEvent);

    this.boundHandlers = boundHandlers;
    $ref.on('select2:select', () => {
      const newValue = getValue($ref.select2('data'), isSimpleArray, usesLabels, multiple);
      const { value: propValue } = this.props;
      if (propValue && newValue !== propValue) {
        $ref.val(propValue).trigger('change.select2');
      }
    });
    this.$ref = $ref;
  }

  shouldComponentUpdate({ options, value, ...props }) {
    const { options: propOptions, multiple, value: propValue } = this.props;
    if (!arrayEquals(options, propOptions)) {
      console.log(`Select2 with label ${this.props.label} will update because of options`);
      return true;
    }
    if ((value || propValue) && multiple ? !arrayEquals(value, propValue) : value !== propValue) {
      console.log(`Select2 with label ${this.props.label} will update because of value`);
      return true;
    }
    const BreakException = {};
    const { boundHandlers } = this;
    try {
      Object.entries(props)
        .filter(([key]) => key.startsWith('on'))
        .forEach(([key, callback]) => {
          if (callback !== boundHandlers[key].callback) {
            throw BreakException;
          }
        });
    } catch (e) {
      console.log(`Select2 with label ${this.props.label} will update because of callback`);
      return true;
    }
    return false;
  }

  componentDidUpdate({ value: oldValue }) {
    console.log(`Select2 with label ${this.props.label} did update`);
    const { value, multiple } = this.props;
    const $ref = $(this.domRef);
    if (value !== oldValue) {
      console.log(`Updating value from Select2 with label ${this.props.label}`);
      $ref.val(value).trigger('change.select2');
    }
    Object.entries(this.props)
      .filter(([key]) => key.startsWith('on'))
      .forEach(([eventName, callback]) => {
        const boundHandler = this.boundHandlers[eventName] || {};
        {
          const { callback: storedCallback, actualCallback, jQueryEvent } = boundHandler;
          if (storedCallback && callback !== storedCallback) {
            console.log(`Unbinding event ${eventName} from Select2 with label ${this.props.label}`);
            $ref.unbind(jQueryEvent, actualCallback);
          }
        }
        if (callback) {
          const jQueryEvent = this.toJQueryEvent(eventName);

          const handleEvent = (event, callback2) => {
            const { params } = event;
            const { data: data2 } = params || {};
            if (data2) {
              // null
            } else {
              // const { target: { value } } = event;
            }
            const value2 = getValue($ref.select2('data'), this.isSimpleArray, this.usesLabels, multiple);
            callback2(value2);
          };

          const actualCallback = (e) => { handleEvent(e, callback); };
          this.boundHandlers[eventName] = { callback, actualCallback, jQueryEvent };
          console.log(`Binding new event ${eventName} from Select2 with label ${this.props.label}`);
          $ref.on(jQueryEvent, actualCallback);
        }
      });
  }

  componentWillUnmount() {
    $(this.domRef)
      .select2()
      .destroy(true);
  }

  // eslint-disable-next-line class-methods-use-this
  toJQueryEvent(eventName) {
    let jQueryEvent;
    switch (eventName) {
      case 'onChange':
        jQueryEvent = 'change';
        break;
      case 'onBeforeClose':
        jQueryEvent = 'select2:closing';
        break;
      case 'onClose':
        jQueryEvent = 'select2:close';
        break;
      case 'onBeforeOpening':
        jQueryEvent = 'select2:opening';
        break;
      case 'onOpen':
        jQueryEvent = 'select2:open';
        break;
      case 'onBeforeSelect':
        jQueryEvent = 'select2:selecting';
        break;
      case 'onSelect':
        jQueryEvent = 'select2:select';
        break;
      case 'onBeforeUnselect':
        jQueryEvent = 'select2:unselecting';
        break;
      case 'onUnselect':
        jQueryEvent = 'select2:unselect';
        break;
      default:
        break;
    }
    return jQueryEvent;
  }

  render() {
    const {
      name, disabled, multiple, value, defaultValue, ...props
    } = this.props;
    return (
      <InputWrapper {...props}>
        <select
          ref={(c) => { this.domRef = c; }}
          name={name}
          className="form-control"
          disabled={disabled}
          multiple={multiple}
          value={value}
          defaultValue={defaultValue}
          style={{ width: '100%' }}
        />
      </InputWrapper>
    );
  }
}

Select2.propTypes = {

};

export default Select2;
