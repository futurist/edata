
interface PlainObject {
    [key: string]: any
}

type RootType = PlainObject;

export default function (root: RootType, util: PlainObject) {
    function dispatch(this: any, action: PlainObject) {
        // action: {type: 'set:a.b', data: 'data'}
        const { type, data } = action
        const colon = type.indexOf(':')
        const mutation = type.substring(0, colon)
        const path = type.substring(colon + 1)
        root.observer.meta.isAction = true
        switch(mutation) {
            case 'set':
                root.set(path, data)
                break
            case 'unset':
                root.unset(path)
                break
        }
        root.observer.meta.isAction = false
    }
    root.dispatch = dispatch
}

