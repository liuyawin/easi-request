## API
```
const cancel = request({
    url,
    type,
    dataType,
    cache,
    header,
    contentType,
    context,
    timeout
}, {
    beforeSend(),
    success(response),
    error(response),
    progress(progress),
    complete(response)
})
```