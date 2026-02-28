import { BaseFilter } from "bloom-filters";
import prisma from "../db/client";

interface IDeserializedFilter {
  fromJSON: (json: JSON) => BaseFilter;
}

/**
 *  Get a bloom filter from the database.
 * @param name Name of the filter in database
 * @param cls Class of the filter to deserialize
 * @returns Deserialized filter of type T
 * @throws Error if no filter is found in database
 */
export async function getFilter<T extends BaseFilter>(
  name: string,
  cls: IDeserializedFilter,
): Promise<T> {
  const bloomFilter = await prisma.bloomFilter.findUniqueOrThrow({
    where: {
      name: name,
    },
  });
  const serializedFilter = bloomFilter.serializedFilter;
  return deserializeFilter<T>(serializedFilter, cls);
}

/**
 * Creates a filter in the database if it does not exist yet.
 * If it exists, it will be overwritten.
 * @param name Name of the filter in database
 * @param filter filter object to serialize
 */
export async function upsertFilter(
  name: string,
  filter: BaseFilter,
): Promise<void> {
  const serializedFilter = new Uint8Array(serializeFilter(filter));
  await prisma.bloomFilter.upsert({
    where: {
      name: name,
    },
    update: {
      serializedFilter: serializedFilter,
    },
    create: {
      name: name,
      serializedFilter: serializedFilter,
    },
  });
}

function serializeFilter(filter: BaseFilter): Uint8Array {
  const filterJSON = filter.saveAsJSON();
  const filterString = JSON.stringify(filterJSON);
  const filterBuffer = Uint8Array.from(filterString);
  return filterBuffer;
}

function deserializeFilter<T extends BaseFilter>(
  serializedFilter: Uint8Array,
  cls: IDeserializedFilter,
): T {
  const filterString = serializedFilter.toString();
  const filterJSON = JSON.parse(filterString);
  const filter = cls.fromJSON(filterJSON) as T;
  return filter;
}
