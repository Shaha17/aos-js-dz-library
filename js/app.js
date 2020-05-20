'use strict';

function ajax(method, url, headers, callbacks, body) {
    if (typeof callbacks.onStart === 'function') {
        callbacks.onStart();
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.onload = () => {
        if (xhr.status < 200 || xhr.status > 299) {
            if (typeof callbacks.onError === 'function') {
                callbacks.onError(xhr.statusText);
                return;
            }
        }
        if (typeof callbacks.onSuccess === 'function') {
            callbacks.onSuccess(xhr.responseText);
        }
    };
    xhr.onloadend = () => {
        if (callbacks.onFinish && typeof callbacks.onFinish === 'function') {
            callbacks.onFinish();
        }
    };
    xhr.onerror = () => {
        if (typeof callbacks.onError === 'function') {
            callbacks.onError('Network Error');
        }
    };

    const sHeaders = Object.entries(headers);
    if (sHeaders.length > 0) {
        xhr.setRequestHeader(sHeaders[0][0], sHeaders[0][1]);
    }

    if (body) {
        xhr.send(body);
    } else {
        xhr.send();
    }
}

// ajax(
//     'GET',
//     'http://127.0.0.1:9999/api/hw31/success',
//     { 'Content-Type': 'application/json' },
//     {
//         onStart: () => {
//             console.log('show loader');
//         },
//         onFinish: () => {
//             console.log('hide loader');
//         },
//         onError: (error) => {
//             console.log(error);
//         },
//         onSuccess: (data) => {
//             console.log(data + ' ' + data);
//         },
//     },
//     JSON.stringify({ message: 'demo' })
// );
