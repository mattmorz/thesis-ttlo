"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown } from "lucide-react";
import { ClientProfileFormType } from "../../schemas/client-profile";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { clientProfileFormSchema } from "../../schemas/client-profile";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface AddProfileFormProps {
  onSubmit: (data: ClientProfileFormType) => void;
  initialData?: Partial<ClientProfileFormType>;
  isEditing?: boolean;
}

export function AddProfileForm({
  onSubmit,
  initialData,
  isEditing = false,
}: AddProfileFormProps) {
  // Initialize the form with initial data if provided
  const form = useForm<ClientProfileFormType>({
    resolver: zodResolver(clientProfileFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      contactNumber: initialData?.contactNumber || "",
      email: initialData?.email || "",
      mailingAddress: initialData?.mailingAddress || "",
      companyName: initialData?.companyName || "",
      companyEmail: initialData?.companyEmail || "",
      occupation: initialData?.occupation || "",
      age: initialData?.age || undefined,
      companyStreet: initialData?.companyStreet || "",
      companyBarangay: initialData?.companyBarangay || "",
      companyCityMunicipality: initialData?.companyCityMunicipality || "",
      companyProvince: initialData?.companyProvince || "",
      degree: initialData?.degree || "",
      profession: initialData?.profession || "",
      publishedResearch: initialData?.publishedResearch || { value: "no" },
      developedMaterials: initialData?.developedMaterials || { value: "no" },
      ipExperience: initialData?.ipExperience || { hasExperience: "no" },
      status: initialData?.status || "draft",
      gender: initialData?.gender || { value: "prefer_not_to_say" },
      citizenship: initialData?.citizenship || { value: "filipino" },
      highestDegree: initialData?.highestDegree || { value: "bachelor" },
      familiarWithIpRights: initialData?.familiarWithIpRights || {
        value: "no",
      },
      userId: initialData?.userId,
      ipApplicationId: initialData?.ipApplicationId,
    },
  });

  // Form submission handler
  const handleSubmit = (data: ClientProfileFormType) => {
    onSubmit(data);
  };

  // Toggle conditional fields visibility
  const [showResearchDetails, setShowResearchDetails] = useState(
    initialData?.publishedResearch?.value === "yes"
  );

  const [showMaterialsDetails, setShowMaterialsDetails] = useState(
    initialData?.developedMaterials?.value === "yes"
  );

  const [showIpExperienceDetails, setShowIpExperienceDetails] = useState(
    initialData?.ipExperience?.hasExperience === "yes"
  );

  const [showCitizenshipDetails, setShowCitizenshipDetails] = useState(
    initialData?.citizenship?.value === "other"
  );

  const [showHighestDegreeDetails, setShowHighestDegreeDetails] = useState(
    initialData?.highestDegree?.value === "other"
  );

  // Update conditional fields visibility when form values change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "publishedResearch.value") {
        setShowResearchDetails(value.publishedResearch?.value === "yes");
      }
      if (name === "developedMaterials.value") {
        setShowMaterialsDetails(value.developedMaterials?.value === "yes");
      }
      if (name === "ipExperience.hasExperience") {
        setShowIpExperienceDetails(value.ipExperience?.hasExperience === "yes");
      }
      if (name === "citizenship.value") {
        setShowCitizenshipDetails(value.citizenship?.value === "other");
      }
      if (name === "highestDegree.value") {
        setShowHighestDegreeDetails(value.highestDegree?.value === "other");
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email*</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="mailingAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mailing Address</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender.value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="citizenship.value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Citizenship</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowCitizenshipDetails(value === "other");
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select citizenship" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="filipino">Filipino</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showCitizenshipDetails && (
            <FormField
              control={form.control}
              name="citizenship.otherValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify Citizenship</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">
            Educational & Professional Background
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profession"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="degree"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Degree</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="highestDegree.value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Highest Education Attainment</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setShowHighestDegreeDetails(value === "other");
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select highest degree" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                    <SelectItem value="master">Master's Degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showHighestDegreeDetails && (
            <FormField
              control={form.control}
              name="highestDegree.otherValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify Highest Degree</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Company Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyStreet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyBarangay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barangay</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyCityMunicipality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City/Municipality</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyProvince"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Province</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Research & IP Experience</h3>

          <FormField
            control={form.control}
            name="publishedResearch.value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Have you published any research?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowResearchDetails(value === "yes");
                    }}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="yes" />
                      </FormControl>
                      <FormLabel className="font-normal">Yes</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="no" />
                      </FormControl>
                      <FormLabel className="font-normal">No</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showResearchDetails && (
            <FormField
              control={form.control}
              name="publishedResearch.details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research Details</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Please provide details about your published research.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="developedMaterials.value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Have you developed any materials?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowMaterialsDetails(value === "yes");
                    }}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="yes" />
                      </FormControl>
                      <FormLabel className="font-normal">Yes</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="no" />
                      </FormControl>
                      <FormLabel className="font-normal">No</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showMaterialsDetails && (
            <FormField
              control={form.control}
              name="developedMaterials.details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materials Details</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Please provide details about the materials you've developed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="ipExperience.hasExperience"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">IP Experience</FormLabel>
                  <FormDescription>
                    Do you have prior experience with intellectual property?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value === "yes"}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? "yes" : "no");
                      setShowIpExperienceDetails(checked);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {showIpExperienceDetails && (
            <FormField
              control={form.control}
              name="ipExperience.types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Experience Types</FormLabel>
                  <FormDescription>
                    Select the types of intellectual property you have
                    experience with:
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="patent"
                        checked={field.value?.patent || false}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...(field.value || {}),
                            patent: checked === true,
                          });
                        }}
                      />
                      <Label htmlFor="patent">Patent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="copyright"
                        checked={field.value?.copyright || false}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...(field.value || {}),
                            copyright: checked === true,
                          });
                        }}
                      />
                      <Label htmlFor="copyright">Copyright</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trademark"
                        checked={field.value?.trademark || false}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...(field.value || {}),
                            trademark: checked === true,
                          });
                        }}
                      />
                      <Label htmlFor="trademark">Trademark</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="utilityModel"
                        checked={field.value?.utilityModel || false}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...(field.value || {}),
                            utilityModel: checked === true,
                          });
                        }}
                      />
                      <Label htmlFor="utilityModel">Utility Model</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="industrialDesign"
                        checked={field.value?.industrialDesign || false}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...(field.value || {}),
                            industrialDesign: checked === true,
                          });
                        }}
                      />
                      <Label htmlFor="industrialDesign">
                        Industrial Design
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="other"
                        checked={field.value?.other || false}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...(field.value || {}),
                            other: checked === true,
                          });
                        }}
                      />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="familiarWithIpRights.value"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Familiar with IP Rights
                  </FormLabel>
                  <FormDescription>
                    Are you familiar with intellectual property rights?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value === "yes"}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? "yes" : "no");
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Profile Status</h3>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            {isEditing ? "Update Profile" : "Create Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
