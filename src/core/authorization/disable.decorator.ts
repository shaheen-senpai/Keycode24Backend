export function Disable() {
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor,
  ) => {
    propertyDescriptor.value = async function () {
      return;
    };
  };
}
