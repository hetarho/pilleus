export abstract class ValueObject<T extends object> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  equals(other?: ValueObject<T> | null): boolean {
    if (!other) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
