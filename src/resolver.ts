abstract class Resolver {
    abstract isResolverValid(): boolean
}

export class FootnoteResolver extends Resolver {
    private defs = new Map<string, string>()
    private usedRef: string[] = []

    addDef(id: string, content: string) {
        this.defs.set(id, content)
    }

    addUsedRef(id: string) {
        if (!this.usedRef.includes(id)) {
            this.usedRef.push(id)
        }
    }

    resolve(id: string) {
        return this.defs.get(id)
    }

    getUsedRef() {
        return this.usedRef
    }

    getUsedRefById(id: string): number {
        return this.usedRef.indexOf(id) + 1
    }

    getDef(id: string) {
        return this.defs.get(id)
    }

    isResolverValid(): boolean {
        return this.defs.size !== 0 && this.usedRef.length !== 0
    }
}