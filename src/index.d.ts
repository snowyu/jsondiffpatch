export type DeltaType = 'movedestination' | 'unchanged' | 'added' | 'modified' | 'deleted' | 'textdiff' | 'moved' | 'node' | 'unknown'
export class BaseFormatter {
  format(delta: Delta, original: any): string;
  prepareContext(context: Context): void;
  typeFormattterNotFound(context: Context, deltaType: DeltaType): void;
  typeFormattterErrorFormatter(context: Context, err): void;
  finalize(context: Context): void;
  recurse(context: Context, delta: Delta, left, key?, leftKey?, movedFrom?, isLast?): void;
  formatDeltaChildren(context: Context, delta: Delta, left): void;
  forEachDeltaKey(delta: Delta, left, fn: (key, leftKey, movedFrom, isLast) => void): void;
  getDeltaType(delta: Delta, movedFrom?): string;
  parseTextDiff(value: string): any[];

  format_movedestination(context: Context, delta?: Delta, leftValue?, key?, leftKey?, movedFrom?): void;
  format_unchanged(context: Context, delta?: Delta, leftValue?, key?, leftKey?, movedFrom?): void;
  format_added(context: Context, delta?: Delta, leftValue?, key?, leftKey?, movedFrom?): void;
  format_modified(context: Context, delta?: Delta, leftValue?, key?, leftKey?, movedFrom?): void;
  format_deleted(context: Context, delta?: Delta, leftValue?, key?, leftKey?, movedFrom?): void;
  format_textdiff(context: Context, delta?: Delta, leftValue?, key?, leftKey?, movedFrom?): void;
  format_moved(context: Context, delta?: Delta, leftValue?, key?, leftKey?, movedFrom?): void;
  format_unknown(context: Context, delta?: Delta, leftValue?, key?, leftKey?, movedFrom?): void;
  nodeBegin(context: Context, key, leftKey, type, nodeType, isLast): void;
  rootBegin(context: Context, type, nodeType): void;
  nodeEnd(context: Context, key, leftKey, type, nodeType, isLast): void;
  rootEnd(context: Context, type, nodeType): void;
}
export interface IFormatter {
  default: typeof BaseFormatter;
  format(delta: Delta, original: any): string;
}

export interface IHtmlFormatter extends IFormatter {
    /**
     * Set whether to show or hide unchanged parts of a diff.
     * @param show Whether to show unchanged parts
     * @param node The root element the diff is contained within. (Default: body)
     * @param delay Transition time in ms. (Default: no transition)
     */
    showUnchanged(show: boolean, node?: Element | null, delay?: number): void;

    /**
     * An alias for showUnchanged(false, ...)
     * @param node The root element the diff is contained within (Default: body)
     * @param delay Transition time in ms. (Default: no transition)
     */
    hideUnchanged(node?: Element | null, delay?: number): void;
}

export interface Delta {
    [key: string]: any;
    [key: number]: any;
}

export class Context {
    nested: boolean;
    exiting?: boolean;
    options: Config;
    parent?: PatchContext;
    childName?: string;
    children?: PatchContext[];
    root?: PatchContext;
    next?: PatchContext;
    nextAfterChildren?: PatchContext;
    hasResult: boolean;
    setResult(result: any): Context;
    exit(): Context;
}

export class PatchContext extends Context {
    pipe: "patch";
    left: any;
    delta: Delta;
}

export class DiffContext extends Context {
    pipe: "diff";
    left: any;
    right: any;
}

export class ReverseContext extends Context {
    pipe: "reverse";
    delta: Delta;
}

type FilterContext = PatchContext | DiffContext | ReverseContext;

/**
 * A plugin which can modify the diff(), patch() or reverse() operations
 */
export interface Filter<TContext extends FilterContext> {
    /**
     * A function which is called at each stage of the operation and can update the context to modify the result
     * @param context The current state of the operation
     */
    (context: TContext): void;

    /**
     * A unique name which can be used to insert other filters before/after, or remove/replace this filter
     */
    filterName: string;
}

/**
 * A collection of Filters run on each diff(), patch() or reverse() operation
 */
export class Pipe<TContext extends FilterContext> {
    /**
     * Append one or more filters to the existing list
     */
    append(...filters: Filter<TContext>[]): Pipe<TContext>;

    /**
     * Prepend one or more filters to the existing list
     */
    prepend(...filters: Filter<TContext>[]): Pipe<TContext>;

    /**
     * Add one ore more filters after the specified filter
     * @param filterName The name of the filter to insert before
     * @param filters Filters to be inserted
     */
    after(filterName: string, ...filters: Filter<TContext>[]): Pipe<TContext>;

    /**
     * Add one ore more filters before the specified filter
     * @param filterName The name of the filter to insert before
     * @param filters Filters to be inserted
     */
    before(filterName: string, ...filters: Filter<TContext>[]): Pipe<TContext>;

    /**
     * Replace the specified filter with one ore more filters
     * @param filterName The name of the filter to replace
     * @param filters Filters to be inserted
     */
    replace(filterName: string, ...filters: Filter<TContext>[]): Pipe<TContext>;

    /**
     * Remove the filter with the specified name
     * @param filterName The name of the filter to remove
     */
    remove(filterName: string): Pipe<TContext>;

    /**
     * Remove all filters from this pipe
     */
    clear(): Pipe<TContext>;

    /**
     * Return array of ordered filter names for this pipe
     */
    list(): Pipe<TContext>;
}

export class Processor {
    constructor(options?: Config);

    pipes: {
        patch: Pipe<PatchContext>;
        diff: Pipe<DiffContext>;
        reverse: Pipe<ReverseContext>;
    };
}

export interface Config {
    // used to match objects when diffing arrays, by default only === operator is used
    objectHash?: (item: any, index: number) => string;

    arrays?: {
        // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
        detectMove: boolean,
        // default false, the value of items moved is not included in deltas
        includeValueOnMove: boolean,
    };

    textDiff?: {
        // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
        minLength: number,
    };

    /**
     * this optional function can be specified to ignore object properties (eg. volatile data)
     * @param name property name, present in either context.left or context.right objects
     * @param context the diff context (has context.left and context.right objects)
     */
    /**
     *
     */
    propertyFilter?: (name: string, context: DiffContext) => boolean;

    /**
     *  default false. if true, values in the obtained delta will be cloned (using jsondiffpatch.clone by default),
     *  to ensure delta keeps no references to left or right objects. this becomes useful if you're diffing and patching
     *  the same objects multiple times without serializing deltas.
     *
     *  instead of true, a function can be specified here to provide a custom clone(value)
     */
    cloneDiffValues?: boolean | ((value: any) => any);
}

export class DiffPatcher {
    constructor(options?: Config);

    processor: Processor;

    clone: (value: any) => any;
    diff: (left: any, right: any) => Delta | undefined;
    patch: (left: any, delta: Delta) => any;
    reverse: (delta: Delta) => Delta | undefined;
    unpatch: (right: any, delta: Delta) => any;
}

export const create: (options?: any) => DiffPatcher

export const formatters: {
  base: IFormatter;
  annotated: IFormatter;
  console: IFormatter;
  html: IHtmlFormatter;
};

export const console: IFormatter

export const dateReviver: (key: string, value: any) => any;

export const diff: (left: any, right: any) => Delta | undefined;
export const patch: (left: any, delta: Delta) => any;
export const reverse: (delta: Delta) => Delta | undefined;
export const unpatch: (right: any, delta: Delta) => any;
